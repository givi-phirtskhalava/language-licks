import { db } from "@lib/db";
import { speechUsage } from "@lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthError } from "@lib/auth";

const TRAINING_LIMIT = 3600;
const TESTING_LIMIT = 900;

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// The Azure Speech SDK runs in the browser and needs a token to open a
// WebSocket directly to Azure for real-time streaming. This endpoint
// serves two purposes:
// 1. Keeps the Azure API key on the server — the client only sees a
//    short-lived token (10-min TTL).
// 2. Enforces monthly usage limits before issuing a token, so users
//    can't exceed their training/testing allowance.
export async function POST() {
  try {
    const { userId } = await requireAuth();

    const key = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION;

    if (!key || !region) {
      return Response.json(
        { error: "Speech service not configured" },
        { status: 503 }
      );
    }

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

    if (
      usage.trainingSeconds >= TRAINING_LIMIT &&
      usage.testingSeconds >= TESTING_LIMIT
    ) {
      return Response.json(
        { error: "Monthly usage limit reached" },
        { status: 403 }
      );
    }

    const tokenResponse = await fetch(
      `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": key,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (!tokenResponse.ok) {
      return Response.json(
        { error: "Failed to issue speech token" },
        { status: 502 }
      );
    }

    const token = await tokenResponse.text();

    return Response.json({ token, region });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
