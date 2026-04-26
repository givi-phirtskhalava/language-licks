import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE = "admin-session";
const SESSION_TTL_HOURS = 12;

function getKey(): Uint8Array {
  const secret = process.env.PAYLOAD_SECRET;
  if (!secret) throw new Error("PAYLOAD_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export interface IAdminSessionPayload {
  adminId: string;
  email: string;
}

export async function signAdminSession(
  data: IAdminSessionPayload,
): Promise<string> {
  return new SignJWT({ ...data })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_HOURS}h`)
    .sign(getKey());
}

export async function verifyAdminSession(
  token: string,
): Promise<IAdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getKey(), {
      algorithms: ["HS256"],
    });

    if (typeof payload.adminId !== "string" || typeof payload.email !== "string") {
      return null;
    }

    return { adminId: payload.adminId, email: payload.email };
  } catch {
    return null;
  }
}

export function buildSessionCookie(token: string): string {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_TTL_HOURS * 60 * 60}`,
  ];

  if (process.env.NODE_ENV === "production") parts.push("Secure");

  return parts.join("; ");
}

export function buildClearSessionCookie(): string {
  const parts = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];

  if (process.env.NODE_ENV === "production") parts.push("Secure");

  return parts.join("; ");
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
