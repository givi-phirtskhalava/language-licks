import { db } from "@lib/db";
import { speechUsage } from "@lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requirePremium, AuthError } from "@lib/auth";

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
    const { userId } = await requirePremium();
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
