import { db } from "@lib/db";
import { users } from "@lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthError, isPremium } from "@lib/auth";

export async function GET() {
  try {
    const { userId } = await requireAuth();

    const user = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        language: users.language,
        subscriptionStatus: users.subscriptionStatus,
        subscriptionPlanEnd: users.subscriptionPlanEnd,
        giftedExpiresAt: users.giftedExpiresAt,
        giftedLifetime: users.giftedLifetime,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) {
      return Response.json({ user: null }, { status: 401 });
    }

    return Response.json({
      user: {
        ...user,
        subscriptionPlanEnd: user.subscriptionPlanEnd
          ? user.subscriptionPlanEnd.getTime()
          : null,
        giftedExpiresAt: user.giftedExpiresAt
          ? user.giftedExpiresAt.getTime()
          : null,
        isPremium: isPremium(user),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ user: null }, { status: error.status });
    }
    throw error;
  }
}
