import { db } from "@lib/db";
import { users } from "@lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthError, isPremium } from "@lib/auth";

export async function GET() {
  try {
    const { userId } = await requireAuth();

    const user = await db
      .select({
        subscriptionStatus: users.subscriptionStatus,
        subscriptionPlanEnd: users.subscriptionPlanEnd,
        paddleSubscriptionId: users.paddleSubscriptionId,
        giftedExpiresAt: users.giftedExpiresAt,
        giftedLifetime: users.giftedLifetime,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlanEnd: user.subscriptionPlanEnd
        ? user.subscriptionPlanEnd.getTime()
        : null,
      hasSubscription: !!user.paddleSubscriptionId,
      giftedExpiresAt: user.giftedExpiresAt
        ? user.giftedExpiresAt.getTime()
        : null,
      giftedLifetime: user.giftedLifetime,
      isPremium: isPremium(user),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
