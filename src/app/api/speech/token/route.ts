import { SignJWT } from "jose";
import { getPayload } from "payload";
import config from "@payload-config";
import { db } from "@lib/db";
import { users } from "@lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthError } from "@lib/auth";

const TOKEN_TTL_SEC = 15 * 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      lessonId?: number;
    } | null;
    const lessonId = body?.lessonId;

    if (typeof lessonId !== "number") {
      return Response.json({ error: "lessonId is required" }, { status: 400 });
    }

    let userId: number | null = null;
    try {
      const auth = await requireAuth();
      userId = auth.userId;
    } catch (error) {
      if (!(error instanceof AuthError)) throw error;
    }

    let isPremium = false;
    if (userId !== null) {
      const user = await db
        .select({
          subscriptionStatus: users.subscriptionStatus,
          subscriptionPlanEnd: users.subscriptionPlanEnd,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
        .then((rows) => rows[0]);

      isPremium =
        user?.subscriptionStatus === "active" ||
        (user?.subscriptionStatus === "canceled" &&
          !!user.subscriptionPlanEnd &&
          user.subscriptionPlanEnd.getTime() > Date.now());
    }

    if (!isPremium) {
      const payload = await getPayload({ config });
      const lesson = await payload
        .findByID({ collection: "lessons", id: lessonId, depth: 0 })
        .catch(() => null);

      if (!lesson) {
        return Response.json({ error: "Lesson not found" }, { status: 404 });
      }

      if (!lesson.isFree) {
        return Response.json(
          { error: "Premium subscription required" },
          { status: 403 }
        );
      }
    }

    const secret = process.env.SPEECH_CHECK_JWT_SECRET;

    if (!secret) {
      return Response.json(
        { error: "Speech-check service not configured" },
        { status: 503 }
      );
    }

    const subject = userId !== null ? String(userId) : "anon";
    const claims = isPremium ? {} : { lessonId };

    const token = await new SignJWT(claims)
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(subject)
      .setIssuedAt()
      .setExpirationTime(`${TOKEN_TTL_SEC}s`)
      .sign(new TextEncoder().encode(secret));

    return Response.json({
      token,
      expiresInSec: TOKEN_TTL_SEC,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
