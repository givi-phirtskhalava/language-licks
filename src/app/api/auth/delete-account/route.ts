import type { NextRequest } from "next/server";
import { db } from "@lib/db";
import { users, progress, speechCredits, dailyActivity } from "@lib/db/schema";
import { eq } from "drizzle-orm";
import {
  requireAuth,
  AuthError,
  isValidOrigin,
  verifyOtp,
  clearAuthCookies,
} from "@lib/auth";

export async function POST(request: NextRequest) {
  if (!isValidOrigin(request)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const code = body.code?.trim();
    const confirmation = body.confirmation?.trim().toLowerCase();

    if (!code) {
      return Response.json(
        { error: "Verification code is required" },
        { status: 400 }
      );
    }

    if (confirmation !== "delete") {
      return Response.json(
        { error: "Type 'delete' to confirm" },
        { status: 400 }
      );
    }

    const user = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const valid = await verifyOtp(user.email, code);

    if (!valid) {
      return Response.json(
        { error: "Invalid or expired code" },
        { status: 401 }
      );
    }

    await db.delete(speechCredits).where(eq(speechCredits.userId, userId));
    await db.delete(progress).where(eq(progress.userId, userId));
    await db.delete(dailyActivity).where(eq(dailyActivity.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
    await clearAuthCookies();

    return Response.json({ deleted: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
