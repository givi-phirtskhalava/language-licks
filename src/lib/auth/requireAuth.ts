import { db } from "@lib/db";
import { users } from "@lib/db/schema";
import { eq } from "drizzle-orm";
import {
  getAccessTokenCookie,
  getRefreshTokenCookie,
  setAuthCookies,
} from "./cookies";
import { verifyAccessToken, verifyRefreshToken } from "./jwt";

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

interface IAuthUser {
  userId: number;
  tokenVersion: number;
}

export async function requireAuth(): Promise<IAuthUser> {
  const accessToken = await getAccessTokenCookie();

  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload) return payload;
  }

  const refreshToken = await getRefreshTokenCookie();
  if (!refreshToken) {
    throw new AuthError("Not authenticated");
  }

  const refreshPayload = await verifyRefreshToken(refreshToken);
  if (!refreshPayload) {
    throw new AuthError("Invalid or expired token");
  }

  const user = await db
    .select({ id: users.id, tokenVersion: users.tokenVersion })
    .from(users)
    .where(eq(users.id, refreshPayload.userId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!user || user.tokenVersion !== refreshPayload.tokenVersion) {
    throw new AuthError("Token revoked");
  }

  await setAuthCookies(user.id, user.tokenVersion);

  return { userId: user.id, tokenVersion: user.tokenVersion };
}
