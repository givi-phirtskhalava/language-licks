export const OAUTH_STATE_COOKIE = "admin-oauth-state";
export const OAUTH_VERIFIER_COOKIE = "admin-oauth-verifier";
export const OAUTH_NEXT_COOKIE = "admin-oauth-next";
export const OAUTH_COOKIE_TTL_SECONDS = 600;

export function buildShortLivedCookie(name: string, value: string): string {
  const parts = [
    `${name}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${OAUTH_COOKIE_TTL_SECONDS}`,
  ];

  if (process.env.NODE_ENV === "production") parts.push("Secure");

  return parts.join("; ");
}

export function buildClearShortLivedCookie(name: string): string {
  const parts = [
    `${name}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];

  if (process.env.NODE_ENV === "production") parts.push("Secure");

  return parts.join("; ");
}
