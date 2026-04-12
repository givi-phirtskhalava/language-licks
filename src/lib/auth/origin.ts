import type { NextRequest } from "next/server";

export function isValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");

  if (!origin) return true;

  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    "http://localhost:3000",
  ].filter(Boolean);

  return allowedOrigins.includes(origin);
}
