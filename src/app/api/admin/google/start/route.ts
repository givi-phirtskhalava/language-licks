import type { NextRequest } from "next/server";

import {
  generateCodeVerifier,
  generateState,
  getGoogleClient,
} from "@lib/adminAuth/google";
import {
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  buildShortLivedCookie,
} from "@lib/adminAuth/oauthCookies";

export async function GET(request: NextRequest) {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const google = getGoogleClient();
  const url = google.createAuthorizationURL(state, codeVerifier, [
    "openid",
    "email",
    "profile",
  ]);

  const hd = process.env.GOOGLE_WORKSPACE_DOMAIN;
  if (hd) url.searchParams.set("hd", hd);

  url.searchParams.set("prompt", "select_account");

  const next = request.nextUrl.searchParams.get("next");

  const headers = new Headers();
  headers.append("Set-Cookie", buildShortLivedCookie(OAUTH_STATE_COOKIE, state));
  headers.append(
    "Set-Cookie",
    buildShortLivedCookie(OAUTH_VERIFIER_COOKIE, codeVerifier),
  );

  if (next && next.startsWith("/admin")) {
    headers.append(
      "Set-Cookie",
      buildShortLivedCookie(OAUTH_NEXT_COOKIE, encodeURIComponent(next)),
    );
  }

  headers.set("Location", url.toString());

  return new Response(null, { status: 302, headers });
}
