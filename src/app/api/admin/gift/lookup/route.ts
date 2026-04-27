import type { NextRequest } from "next/server";
import { db } from "@lib/db";
import { users } from "@lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSuperAdmin, AuthError, isPremium } from "@lib/auth";

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin(request.headers);

    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        language: users.language,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
        paddleCustomerId: users.paddleCustomerId,
        paddleSubscriptionId: users.paddleSubscriptionId,
        subscriptionStatus: users.subscriptionStatus,
        subscriptionPlanEnd: users.subscriptionPlanEnd,
        giftedExpiresAt: users.giftedExpiresAt,
        giftedLifetime: users.giftedLifetime,
        giftedAt: users.giftedAt,
        giftedNote: users.giftedNote,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({
      user: {
        ...user,
        createdAt: user.createdAt.getTime(),
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt.getTime() : null,
        subscriptionPlanEnd: user.subscriptionPlanEnd
          ? user.subscriptionPlanEnd.getTime()
          : null,
        giftedExpiresAt: user.giftedExpiresAt
          ? user.giftedExpiresAt.getTime()
          : null,
        giftedAt: user.giftedAt ? user.giftedAt.getTime() : null,
        isPremium: isPremium(user),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
