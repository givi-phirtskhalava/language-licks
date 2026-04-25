import type { NextRequest } from "next/server";
import { db } from "@lib/db";
import { users } from "@lib/db/schema";
import { eq } from "drizzle-orm";
import { isValidOrigin, verifyOtp, setAuthCookies } from "@lib/auth";

export async function POST(request: NextRequest) {
  if (!isValidOrigin(request)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const email = body.email?.trim().toLowerCase();
  const code = body.code?.trim();
  if (!email || !code) {
    return Response.json(
      { error: "Email and code are required" },
      { status: 400 }
    );
  }

  const valid = await verifyOtp(email, code);

  if (!valid) {
    return Response.json(
      { error: "Invalid or expired code" },
      { status: 401 }
    );
  }

  let user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .then((rows) => rows[0]);

  if (!user) {
    const inserted = await db
      .insert(users)
      .values({ email, lastLoginAt: new Date() })
      .returning();
    user = inserted[0];
  } else {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));
  }

  await setAuthCookies(user.id, user.tokenVersion);

  return Response.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
}
