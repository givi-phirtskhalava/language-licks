import { db } from "@lib/db";
import { speechUsage } from "@lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requirePremium, AuthError } from "@lib/auth";
import type { NextRequest } from "next/server";

const TRAINING_LIMIT = 3600;
const TESTING_LIMIT = 900;
const MAX_AUDIO_SIZE = 1_000_000; // 1MB

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// Map browser MIME types to Azure-accepted content types
function getAzureContentType(mimeType: string): string | null {
  if (mimeType.includes("ogg")) {
    return "audio/ogg";
  }
  if (mimeType.includes("webm")) {
    return "audio/webm";
  }
  if (mimeType.includes("mp4") || mimeType.includes("m4a")) {
    return "audio/mp4";
  }
  if (mimeType.includes("wav")) {
    return "audio/wav";
  }
  return null;
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
    const mode = formData.get("mode") as string | null;

    if (!audio || !lang || !mode) {
      return Response.json(
        { error: "audio, lang, and mode are required" },
        { status: 400 }
      );
    }

    if (mode !== "training" && mode !== "testing") {
      return Response.json(
        { error: "mode must be 'training' or 'testing'" },
        { status: 400 }
      );
    }

    console.log(`[recognize] user=${userId} lang=${lang} mode=${mode} audioType=${audio.type} audioSize=${(audio.size / 1024).toFixed(1)}KB`);

    if (audio.size > MAX_AUDIO_SIZE) {
      return Response.json(
        { error: "Audio file too large (max 1MB)" },
        { status: 413 }
      );
    }

    // Check monthly budget
    const month = getCurrentMonth();
    const limit = mode === "training" ? TRAINING_LIMIT : TESTING_LIMIT;

    const rows = await db
      .select({
        trainingSeconds: speechUsage.trainingSeconds,
        testingSeconds: speechUsage.testingSeconds,
      })
      .from(speechUsage)
      .where(and(eq(speechUsage.userId, userId), eq(speechUsage.month, month)))
      .limit(1);

    const usage = rows[0] ?? { trainingSeconds: 0, testingSeconds: 0 };
    const currentUsage =
      mode === "training" ? usage.trainingSeconds : usage.testingSeconds;

    if (currentUsage >= limit) {
      return Response.json(
        { error: "Monthly usage limit reached" },
        { status: 403 }
      );
    }

    // Determine Azure content type from the browser's MIME type
    const contentType = getAzureContentType(audio.type);
    console.log(`[recognize] mapped content type: ${audio.type} -> ${contentType}`);
    if (!contentType) {
      return Response.json(
        { error: `Unsupported audio format: ${audio.type}` },
        { status: 415 }
      );
    }

    const audioBuffer = await audio.arrayBuffer();

    // Call Azure Speech-to-Text REST API
    const azureUrl = new URL(
      `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`
    );
    azureUrl.searchParams.set("language", lang);

    const azureRes = await fetch(azureUrl.toString(), {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": contentType,
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

    // Calculate duration from Azure's response (offset + duration in ticks, 1 tick = 100ns)
    const durationTicks = (result.Duration ?? 0) as number;
    const durationSeconds = durationTicks / 10_000_000;

    // Record usage
    const column =
      mode === "training"
        ? speechUsage.trainingSeconds
        : speechUsage.testingSeconds;

    await db
      .insert(speechUsage)
      .values({
        userId,
        month,
        trainingSeconds: mode === "training" ? durationSeconds : 0,
        testingSeconds: mode === "testing" ? durationSeconds : 0,
      })
      .onConflictDoUpdate({
        target: [speechUsage.userId, speechUsage.month],
        set: {
          [mode === "training" ? "trainingSeconds" : "testingSeconds"]:
            sql`${column} + ${durationSeconds}`,
        },
      });

    // Return transcript
    const transcript =
      result.RecognitionStatus === "Success" ? (result.DisplayText ?? "") : "";

    console.log(`[recognize] returning transcript="${transcript}" duration=${durationSeconds}s`);
    return Response.json({ transcript, durationSeconds });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
