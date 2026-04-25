import { db } from "@lib/db";
import { users } from "@lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthError } from "./requireAuth";
import { isPremium } from "./isPremium";

interface IAuthUser {
  userId: number;
  tokenVersion: number;
}

export async function requirePremium(): Promise<IAuthUser> {
  const auth = await requireAuth();

  const user = await db
    .select({
      subscriptionStatus: users.subscriptionStatus,
      subscriptionPlanEnd: users.subscriptionPlanEnd,
      giftedLifetime: users.giftedLifetime,
      giftedExpiresAt: users.giftedExpiresAt,
    })
    .from(users)
    .where(eq(users.id, auth.userId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!user || !isPremium(user)) {
    throw new AuthError("Premium subscription required", 403);
  }

  return auth;
}
