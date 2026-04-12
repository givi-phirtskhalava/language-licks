import { cookies } from "next/headers";
import {
  signAccessToken,
  signRefreshToken,
  type IAccessTokenPayload,
  type IRefreshTokenPayload,
} from "./jwt";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function setAuthCookies(userId: number, tokenVersion: number) {
  const accessToken = await signAccessToken({ userId, tokenVersion });
  const refreshToken = await signRefreshToken({ userId, tokenVersion });
  const cookieStore = await cookies();

  cookieStore.set("access_token", accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60,
  });

  cookieStore.set("refresh_token", refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 90 * 24 * 60 * 60,
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();

  cookieStore.set("access_token", "", {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });

  cookieStore.set("refresh_token", "", {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });
}

export async function getAccessTokenCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value;
}

export async function getRefreshTokenCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("refresh_token")?.value;
}
