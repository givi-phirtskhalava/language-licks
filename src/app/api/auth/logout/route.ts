import type { NextRequest } from "next/server";
import { isValidOrigin, clearAuthCookies } from "@lib/auth";

export async function POST(request: NextRequest) {
  if (!isValidOrigin(request)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await clearAuthCookies();
  return Response.json({ loggedOut: true });
}
