import { Paddle, EventName, Environment } from "@paddle/paddle-node-sdk";
import { db } from "@lib/db";
import { users } from "@lib/db/schema";
import { eq } from "drizzle-orm";
import { pauseNonFreeReviews } from "@lib/db/pauseNonFreeReviews";

if (!process.env.PADDLE_API_KEY) {
  throw new Error("PADDLE_API_KEY is not set");
}

const paddle = new Paddle(process.env.PADDLE_API_KEY, {
  environment:
    process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox"
      ? Environment.sandbox
      : Environment.production,
});

const ACTIVE_STATUSES = new Set([
  EventName.SubscriptionCreated,
  EventName.SubscriptionActivated,
  EventName.SubscriptionResumed,
]);

const INACTIVE_STATUSES = new Set([
  EventName.SubscriptionPastDue,
  EventName.SubscriptionPaused,
]);

export async function POST(request: Request) {
  const signature = request.headers.get("paddle-signature");
  const rawBody = await request.text();

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  let event;
  try {
    event = await paddle.webhooks.unmarshal(
      rawBody,
      process.env.PADDLE_WEBHOOK_SECRET!,
      signature
    );
  } catch {
    return new Response("Invalid signature", { status: 401 });
  }

  const eventType = event.eventType;

  if (!eventType.startsWith("subscription.")) {
    return new Response("OK", { status: 200 });
  }

  const data = event.data as {
    id: string;
    status: string;
    customerId: string;
    customData: Record<string, string> | null;
    currentBillingPeriod: { startsAt: string; endsAt: string } | null;
    scheduledChange: { action: string; effectiveAt: string } | null;
  };

  const userId = data.customData?.userId
    ? Number(data.customData.userId)
    : null;

  if (!userId) {
    console.error("Paddle webhook missing userId in customData", data);
    return new Response("OK", { status: 200 });
  }

  if (ACTIVE_STATUSES.has(eventType)) {
    const planEnd = data.currentBillingPeriod?.endsAt
      ? new Date(data.currentBillingPeriod.endsAt)
      : null;

    await db
      .update(users)
      .set({
        paddleCustomerId: data.customerId,
        paddleSubscriptionId: data.id,
        subscriptionStatus: "active",
        subscriptionPlanEnd: planEnd,
      })
      .where(eq(users.id, userId));
  } else if (eventType === EventName.SubscriptionCanceled) {
    const planEnd = data.currentBillingPeriod?.endsAt
      ? new Date(data.currentBillingPeriod.endsAt)
      : null;

    await db
      .update(users)
      .set({
        subscriptionStatus: "canceled",
        subscriptionPlanEnd: planEnd,
      })
      .where(eq(users.id, userId));

    if (!planEnd || planEnd.getTime() <= Date.now()) {
      await pauseNonFreeReviews(userId);
    }
  } else if (INACTIVE_STATUSES.has(eventType)) {
    const status =
      eventType === EventName.SubscriptionPastDue ? "past_due" : "paused";

    await db
      .update(users)
      .set({ subscriptionStatus: status })
      .where(eq(users.id, userId));

    await pauseNonFreeReviews(userId);
  } else if (eventType === EventName.SubscriptionUpdated) {
    const planEnd = data.currentBillingPeriod?.endsAt
      ? new Date(data.currentBillingPeriod.endsAt)
      : null;

    const status =
      data.scheduledChange?.action === "cancel" ? "canceled" : data.status;

    await db
      .update(users)
      .set({
        subscriptionStatus: status,
        subscriptionPlanEnd: planEnd,
      })
      .where(eq(users.id, userId));

    if (status !== "active") {
      await pauseNonFreeReviews(userId);
    }
  }

  return new Response("OK", { status: 200 });
}
