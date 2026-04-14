import { db } from "@lib/db";
import { users } from "@lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthError } from "@lib/auth";

export async function GET() {
  try {
    const { userId } = await requireAuth();

    const user = await db
      .select({
        subscriptionStatus: users.subscriptionStatus,
        subscriptionPlanEnd: users.subscriptionPlanEnd,
        paddleSubscriptionId: users.paddleSubscriptionId,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const isPremium =
      user.subscriptionStatus === "active" ||
      (user.subscriptionStatus === "canceled" &&
        !!user.subscriptionPlanEnd &&
        user.subscriptionPlanEnd.getTime() > Date.now());

    return Response.json({
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlanEnd: user.subscriptionPlanEnd
        ? user.subscriptionPlanEnd.getTime()
        : null,
      hasSubscription: !!user.paddleSubscriptionId,
      isPremium,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
