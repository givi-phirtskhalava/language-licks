import { Paddle, Environment } from "@paddle/paddle-node-sdk";
import { db } from "@lib/db";
import { users } from "@lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthError } from "@lib/auth";

if (!process.env.PADDLE_API_KEY) {
  throw new Error("PADDLE_API_KEY is not set");
}

const paddle = new Paddle(process.env.PADDLE_API_KEY, {
  environment:
    process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox"
      ? Environment.sandbox
      : Environment.production,
});

export async function POST() {
  try {
    const { userId } = await requireAuth();

    const user = await db
      .select({
        paddleSubscriptionId: users.paddleSubscriptionId,
        subscriptionStatus: users.subscriptionStatus,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user?.paddleSubscriptionId) {
      return Response.json(
        { error: "No active subscription" },
        { status: 400 }
      );
    }

    if (user.subscriptionStatus !== "active") {
      return Response.json(
        { error: "Subscription is not active" },
        { status: 400 }
      );
    }

    const sub = await paddle.subscriptions.cancel(
      user.paddleSubscriptionId,
      { effectiveFrom: "next_billing_period" }
    );

    const planEnd = sub.currentBillingPeriod?.endsAt
      ? new Date(sub.currentBillingPeriod.endsAt)
      : null;

    await db
      .update(users)
      .set({
        subscriptionStatus: "canceled",
        ...(planEnd && { subscriptionPlanEnd: planEnd }),
      })
      .where(eq(users.id, userId));

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
