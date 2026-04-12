import type { NextRequest } from "next/server";
import { db } from "@lib/db";
import { users } from "@lib/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  requireAuth,
  AuthError,
  isValidOrigin,
  verifyOtp,
  setAuthCookies,
} from "@lib/auth";

export async function POST(request: NextRequest) {
  if (!isValidOrigin(request)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const newEmail = body.email?.trim().toLowerCase();
    const code = body.code?.trim();

    if (!newEmail || !code) {
      return Response.json(
        { error: "New email and verification code are required" },
        { status: 400 }
      );
    }

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, newEmail))
      .limit(1)
      .then((rows) => rows[0]);

    if (existing) {
      return Response.json(
        { error: "Email is already in use" },
        { status: 409 }
      );
    }

    const valid = await verifyOtp(newEmail, code);

    if (!valid) {
      return Response.json(
        { error: "Invalid or expired code" },
        { status: 401 }
      );
    }

    const updated = await db
      .update(users)
      .set({
        email: newEmail,
        tokenVersion: sql`${users.tokenVersion} + 1`,
      })
      .where(eq(users.id, userId))
      .returning();

    const user = updated[0];
    await setAuthCookies(user.id, user.tokenVersion);

    return Response.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
