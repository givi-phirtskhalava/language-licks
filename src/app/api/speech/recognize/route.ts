import { db } from "@lib/db";
import { speechCredits } from "@lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { requirePremium, AuthError } from "@lib/auth";
import type { NextRequest } from "next/server";
import { topUpCredits } from "../topUpCredits";

// 15s of 16kHz 16-bit mono WAV = 480,044 bytes
const MAX_AUDIO_SIZE = 480_100;

// Validate actual WAV bytes: RIFF header + 16kHz + mono + 16-bit
function isValidWav(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 44) return false;
  const view = new DataView(buffer);
  const riff = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3)
  );
  const wave = String.fromCharCode(
    view.getUint8(8),
    view.getUint8(9),
    view.getUint8(10),
    view.getUint8(11)
  );
  if (riff !== "RIFF" || wave !== "WAVE") return false;
  const sampleRate = view.getUint32(24, true);
  const channels = view.getUint16(22, true);
  const bitsPerSample = view.getUint16(34, true);
  return sampleRate === 16000 && channels === 1 && bitsPerSample === 16;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requirePremium();

    const key = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION;

    if (!key || !region) {
      return Response.json(
        { error: "Speech service not configured" },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const audio = formData.get("audio") as File | null;
    const lang = formData.get("lang") as string | null;
    const referenceText = formData.get("referenceText") as string | null;

    if (!audio || !lang) {
      return Response.json(
        { error: "audio and lang are required" },
        { status: 400 }
      );
    }

    console.log(
      `[recognize] user=${userId} lang=${lang} audioType=${audio.type} audioSize=${(audio.size / 1024).toFixed(1)}KB`
    );

    if (audio.size > MAX_AUDIO_SIZE) {
      return Response.json({ error: "Audio file too large" }, { status: 413 });
    }

    // Top up and check credits
    const balance = await topUpCredits(userId);

    if (balance <= 0) {
      return Response.json({ error: "No credits remaining" }, { status: 403 });
    }

    const audioBuffer = await audio.arrayBuffer();

    // Validate actual file bytes — only accept 16kHz 16-bit mono WAV
    if (!isValidWav(audioBuffer)) {
      return Response.json(
        { error: "Unsupported audio format" },
        { status: 415 }
      );
    }

    // Plain STT call — no pronunciation assessment.
    // Azure pronunciation assessment force-aligns the transcript to the
    // reference text, making it useless for verifying what was actually said.
    const azureUrl = new URL(
      `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`
    );
    azureUrl.searchParams.set("language", lang);

    const azureRes = await fetch(azureUrl.toString(), {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "audio/wav",
        Accept: "application/json",
      },
      body: audioBuffer,
    });

    console.log(`[recognize] Azure response status: ${azureRes.status}`);

    if (!azureRes.ok) {
      const errorText = await azureRes.text();
      console.log("[recognize] Azure error:", errorText);
      return Response.json(
        { error: "Speech recognition failed" },
        { status: 502 }
      );
    }

    const result = await azureRes.json();
    console.log("[recognize] Azure result:", JSON.stringify(result));

    // Deduct 1 credit
    await db
      .update(speechCredits)
      .set({ balance: sql`${speechCredits.balance} - 1` })
      .where(eq(speechCredits.userId, userId));

    const transcript =
      result.RecognitionStatus === "Success" ? (result.DisplayText ?? "") : "";

    console.log(`[recognize] transcript="${transcript}"`);
    return Response.json({ transcript, pronunciation: null });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
