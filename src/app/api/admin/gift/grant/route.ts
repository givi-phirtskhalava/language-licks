import type { NextRequest } from "next/server";
import { db } from "@lib/db";
import { users } from "@lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin, AuthError } from "@lib/auth";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request.headers);

    const body = await request.json();
    const userId = body?.userId;
    const lifetime = body?.lifetime === true;
    const months = typeof body?.months === "number" ? body.months : null;
    const note = typeof body?.note === "string" ? body.note.trim().slice(0, 500) : null;

    if (typeof userId !== "number") {
      return Response.json({ error: "userId is required" }, { status: 400 });
    }

    if (!lifetime && (months === null || !Number.isInteger(months) || months < 1 || months > 1200)) {
      return Response.json(
        { error: "months must be an integer between 1 and 1200, or set lifetime: true" },
        { status: 400 }
      );
    }

    const existing = await db
      .select({
        id: users.id,
        giftedExpiresAt: users.giftedExpiresAt,
        giftedLifetime: users.giftedLifetime,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!existing) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();

    if (lifetime) {
      await db
        .update(users)
        .set({
          giftedLifetime: true,
          giftedExpiresAt: null,
          giftedAt: now,
          giftedNote: note,
        })
        .where(eq(users.id, userId));
    } else {
      const base =
        existing.giftedExpiresAt && existing.giftedExpiresAt.getTime() > now.getTime()
          ? existing.giftedExpiresAt
          : now;

      const next = new Date(base);
      next.setMonth(next.getMonth() + (months as number));

      await db
        .update(users)
        .set({
          giftedLifetime: false,
          giftedExpiresAt: next,
          giftedAt: now,
          giftedNote: note,
        })
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
