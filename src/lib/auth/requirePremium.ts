import { db } from "@lib/db";
import { users } from "@lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthError } from "./requireAuth";

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
    })
    .from(users)
    .where(eq(users.id, auth.userId))
    .limit(1)
    .then((rows) => rows[0]);

  const isPremium =
    user?.subscriptionStatus === "active" ||
    (user?.subscriptionStatus === "canceled" &&
      !!user.subscriptionPlanEnd &&
      user.subscriptionPlanEnd.getTime() > Date.now());

  if (!isPremium) {
    throw new AuthError("Premium subscription required", 403);
  }

  return auth;
}
