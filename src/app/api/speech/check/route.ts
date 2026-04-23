import { eq } from "drizzle-orm";
import { GoogleAuth, type IdTokenClient } from "google-auth-library";
import { getPayload } from "payload";
import config from "@payload-config";
import { AuthError, requireAuth } from "@lib/auth";
import { db } from "@lib/db";
import { users } from "@lib/db/schema";

const MAX_AUDIO_BYTES = Number(process.env.SPEECH_CHECK_MAX_AUDIO_BYTES ?? 480 * 1024);
const PER_USER_RPM = Number(process.env.SPEECH_CHECK_PER_USER_RPM ?? 60);

const rateWindow = new Map<string, number[]>();

function rateLimit(key: string): boolean {
  const now = Date.now();
  const cutoff = now - 60_000;
  const hits = (rateWindow.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= PER_USER_RPM) {
    rateWindow.set(key, hits);
    return false;
  }
  hits.push(now);
  rateWindow.set(key, hits);
  return true;
}

function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  return xff ? xff.split(",")[0].trim() : "unknown";
}

let idTokenClient: Promise<IdTokenClient> | null = null;

async function getAuthHeaders(audience: string): Promise<HeadersInit> {
  if (process.env.NODE_ENV === "development") return {};
  if (!idTokenClient) {
    const rawKey = process.env.GCP_SA_KEY;
    if (!rawKey) throw new Error("GCP_SA_KEY not configured");
    const auth = new GoogleAuth({ credentials: JSON.parse(rawKey) });
    idTokenClient = auth.getIdTokenClient(audience);
  }
  const client = await idTokenClient;
  return client.getRequestHeaders(audience);
}

async function userIsPremium(userId: number): Promise<boolean> {
  const user = await db
    .select({
      subscriptionStatus: users.subscriptionStatus,
      subscriptionPlanEnd: users.subscriptionPlanEnd,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!user) return false;
  if (user.subscriptionStatus === "active") return true;
  if (
    user.subscriptionStatus === "canceled" &&
    user.subscriptionPlanEnd &&
    user.subscriptionPlanEnd.getTime() > Date.now()
  ) {
    return true;
  }
  return false;
}

async function lessonIsFree(lessonId: number): Promise<boolean> {
  const payload = await getPayload({ config });
  const lesson = await payload
    .findByID({ collection: "lessons", id: lessonId, depth: 0 })
    .catch(() => null);
  return !!lesson?.isFree;
}

export async function POST(request: Request) {
  const scorerUrl = process.env.SPEECH_CHECK_URL;
  if (!scorerUrl) {
    return Response.json({ error: "speech_check_not_configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  const lang = url.searchParams.get("lang") ?? "";
  const target = url.searchParams.get("target") ?? "";
  const rawLessonId = url.searchParams.get("lessonId") ?? "";
  const lessonId = Number(rawLessonId);

  if (!lang) {
    return Response.json({ error: "missing_lang" }, { status: 400 });
  }
  if (!rawLessonId || !Number.isFinite(lessonId)) {
    return Response.json({ error: "missing_lesson_id" }, { status: 400 });
  }

  let userId: number | null = null;
  try {
    const auth = await requireAuth();
    userId = auth.userId;
  } catch (error) {
    if (!(error instanceof AuthError)) throw error;
    // Anon users allowed through if the lesson is free (gated below).
  }

  if (userId !== null) {
    const isPremium = await userIsPremium(userId);
    if (!isPremium && !(await lessonIsFree(lessonId))) {
      return Response.json({ error: "premium_required" }, { status: 403 });
    }
  } else if (!(await lessonIsFree(lessonId))) {
    return Response.json({ error: "auth_required" }, { status: 401 });
  }

  const rateKey = userId !== null ? `u:${userId}` : `ip:${getClientIp(request)}`;
  if (!rateLimit(rateKey)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  const declaredSize = Number(request.headers.get("content-length") ?? "0");
  if (declaredSize > MAX_AUDIO_BYTES) {
    return Response.json({ error: "audio_too_large" }, { status: 413 });
  }

  const form = await request.formData();
  const audio = form.get("audio");
  if (!(audio instanceof Blob)) {
    return Response.json({ error: "missing_audio" }, { status: 400 });
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return Response.json({ error: "audio_too_large" }, { status: 413 });
  }

  const upstreamForm = new FormData();
  upstreamForm.append("audio", audio, "audio.wav");

  const upstreamParams = new URLSearchParams({ lang });
  if (target) upstreamParams.set("target", target);
  const upstreamUrl = `${scorerUrl}/transcribe?${upstreamParams.toString()}`;

  const upstream = await fetch(upstreamUrl, {
    method: "POST",
    headers: await getAuthHeaders(scorerUrl),
    body: upstreamForm,
  });

  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}
