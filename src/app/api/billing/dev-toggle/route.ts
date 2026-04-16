import { db } from "@lib/db";
import { users } from "@lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthError } from "@lib/auth";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { userId } = await requireAuth();

    const user = await db
      .select({ subscriptionStatus: users.subscriptionStatus })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((rows) => rows[0]);

    const isActive = user?.subscriptionStatus === "active";

    if (isActive) {
      await db
        .update(users)
        .set({ subscriptionStatus: null, subscriptionPlanEnd: null })
        .where(eq(users.id, userId));
    } else {
      const oneYear = new Date();
      oneYear.setFullYear(oneYear.getFullYear() + 1);
      await db
        .update(users)
        .set({ subscriptionStatus: "active", subscriptionPlanEnd: oneYear })
        .where(eq(users.id, userId));
    }

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
