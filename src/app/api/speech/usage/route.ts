import type { NextRequest } from "next/server";
import { db } from "@lib/db";
import { speechUsage } from "@lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, AuthError } from "@lib/auth";

const TRAINING_LIMIT = 3600;
const TESTING_LIMIT = 900;

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const month = getCurrentMonth();

    const rows = await db
      .select({
        trainingSeconds: speechUsage.trainingSeconds,
        testingSeconds: speechUsage.testingSeconds,
      })
      .from(speechUsage)
      .where(and(eq(speechUsage.userId, userId), eq(speechUsage.month, month)))
      .limit(1);

    const usage = rows[0] ?? { trainingSeconds: 0, testingSeconds: 0 };

    return Response.json({
      trainingSeconds: usage.trainingSeconds,
      testingSeconds: usage.testingSeconds,
      trainingLimit: TRAINING_LIMIT,
      testingLimit: TESTING_LIMIT,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const { durationSeconds, mode } = body;

    if (typeof durationSeconds !== "number" || durationSeconds <= 0) {
      return Response.json(
        { error: "durationSeconds must be a positive number" },
        { status: 400 }
      );
    }

    if (mode !== "training" && mode !== "testing") {
      return Response.json(
        { error: "mode must be 'training' or 'testing'" },
        { status: 400 }
      );
    }

    const month = getCurrentMonth();
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

    const rows = await db
      .select({
        trainingSeconds: speechUsage.trainingSeconds,
        testingSeconds: speechUsage.testingSeconds,
      })
      .from(speechUsage)
      .where(and(eq(speechUsage.userId, userId), eq(speechUsage.month, month)))
      .limit(1);

    const usage = rows[0]!;

    return Response.json({
      trainingSeconds: usage.trainingSeconds,
      testingSeconds: usage.testingSeconds,
      trainingLimit: TRAINING_LIMIT,
      testingLimit: TESTING_LIMIT,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
