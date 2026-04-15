import { db } from "@lib/db";
import { speechCredits } from "@lib/db/schema";
import { eq, sql } from "drizzle-orm";

const IS_DEV = process.env.NODE_ENV === "development";
const DAILY_ALLOWANCE = IS_DEV ? 1000 : 30;
const MAX_ACCUMULATION = IS_DEV ? 1000 : 300;

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function topUpCredits(userId: number): Promise<number> {
  const today = getToday();

  const rows = await db
    .select({
      balance: speechCredits.balance,
      lastCreditDate: speechCredits.lastCreditDate,
    })
    .from(speechCredits)
    .where(eq(speechCredits.userId, userId))
    .limit(1);

  if (!rows[0]) {
    await db.insert(speechCredits).values({
      userId,
      balance: DAILY_ALLOWANCE,
      lastCreditDate: today,
    });
    return DAILY_ALLOWANCE;
  }

  const row = rows[0];

  if (row.lastCreditDate === today) {
    return row.balance;
  }

  // Calculate days missed (cap at what would reach MAX_ACCUMULATION)
  const lastDate = new Date(row.lastCreditDate);
  const todayDate = new Date(today);
  const daysMissed = Math.floor(
    (todayDate.getTime() - lastDate.getTime()) / 86_400_000
  );
  const creditsToAdd = daysMissed * DAILY_ALLOWANCE;

  const newBalance = Math.min(row.balance + creditsToAdd, MAX_ACCUMULATION);

  await db
    .update(speechCredits)
    .set({
      balance: newBalance,
      lastCreditDate: today,
    })
    .where(eq(speechCredits.userId, userId));

  return newBalance;
}
