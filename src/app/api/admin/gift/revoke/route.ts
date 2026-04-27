import type { NextRequest } from "next/server";
import { db } from "@lib/db";
import { users } from "@lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSuperAdmin, AuthError } from "@lib/auth";

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin(request.headers);

    const body = await request.json();
    const userId = body?.userId;

    if (typeof userId !== "number") {
      return Response.json({ error: "userId is required" }, { status: 400 });
    }

    await db
      .update(users)
      .set({
        giftedLifetime: false,
        giftedExpiresAt: null,
        giftedAt: null,
        giftedNote: null,
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
