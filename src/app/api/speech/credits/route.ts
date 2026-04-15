import { db } from "@lib/db";
import { speechCredits } from "@lib/db/schema";
import { eq } from "drizzle-orm";
import { requirePremium, AuthError } from "@lib/auth";
import { topUpCredits } from "../topUpCredits";

const DAILY_ALLOWANCE = 30;
const MAX_ACCUMULATION = 300;

export async function GET() {
  try {
    const { userId } = await requirePremium();

    await topUpCredits(userId);

    const rows = await db
      .select({ balance: speechCredits.balance })
      .from(speechCredits)
      .where(eq(speechCredits.userId, userId))
      .limit(1);

    const balance = rows[0]?.balance ?? DAILY_ALLOWANCE;

    return Response.json({
      balance,
      dailyAllowance: DAILY_ALLOWANCE,
      maxAccumulation: MAX_ACCUMULATION,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
