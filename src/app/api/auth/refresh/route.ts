import type { NextRequest } from "next/server";
import { db } from "@lib/db";
import { users } from "@lib/db/schema";
import { eq } from "drizzle-orm";
import {
  getRefreshTokenCookie,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from "@lib/auth";

export async function POST(request: NextRequest) {
  const refreshToken = await getRefreshTokenCookie();

  if (!refreshToken) {
    return Response.json({ error: "No refresh token" }, { status: 401 });
  }

  const payload = await verifyRefreshToken(refreshToken);

  if (!payload) {
    await clearAuthCookies();
    return Response.json({ error: "Invalid refresh token" }, { status: 401 });
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!user || user.tokenVersion !== payload.tokenVersion) {
    await clearAuthCookies();
    return Response.json({ error: "Token revoked" }, { status: 401 });
  }

  await setAuthCookies(user.id, user.tokenVersion);

  return Response.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
}
