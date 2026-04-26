import type { NextRequest } from "next/server";
import { getPayload } from "payload";

import config from "@payload-config";
import {
  getGoogleClient,
  isWorkspaceDomainAllowed,
  verifyGoogleIdToken,
} from "@lib/adminAuth/google";
import {
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  buildClearShortLivedCookie,
} from "@lib/adminAuth/oauthCookies";
import {
  buildSessionCookie,
  signAdminSession,
} from "@lib/adminAuth/session";

function readCookie(request: NextRequest, name: string): string | null {
  const value = request.cookies.get(name)?.value;
  return value ?? null;
}

function buildErrorRedirect(reason: string): Response {
  const headers = new Headers();
  headers.append("Set-Cookie", buildClearShortLivedCookie(OAUTH_STATE_COOKIE));
  headers.append("Set-Cookie", buildClearShortLivedCookie(OAUTH_VERIFIER_COOKIE));
  headers.append("Set-Cookie", buildClearShortLivedCookie(OAUTH_NEXT_COOKIE));
  headers.set(
    "Location",
    `/?adminAuthError=${encodeURIComponent(reason)}`,
  );
  return new Response(null, { status: 302, headers });
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  const storedState = readCookie(request, OAUTH_STATE_COOKIE);
  const storedVerifier = readCookie(request, OAUTH_VERIFIER_COOKIE);
  const nextEncoded = readCookie(request, OAUTH_NEXT_COOKIE);

  if (!code || !state || !storedState || !storedVerifier) {
    return buildErrorRedirect("missing_oauth_params");
  }

  if (state !== storedState) {
    return buildErrorRedirect("state_mismatch");
  }

  const google = getGoogleClient();

  let idToken: string;
  try {
    const tokens = await google.validateAuthorizationCode(code, storedVerifier);
    idToken = tokens.idToken();
  } catch {
    return buildErrorRedirect("token_exchange_failed");
  }

  let claims;
  try {
    claims = await verifyGoogleIdToken(idToken);
  } catch {
    return buildErrorRedirect("invalid_id_token");
  }

  if (!isWorkspaceDomainAllowed(claims)) {
    return buildErrorRedirect("domain_not_allowed");
  }

  const payload = await getPayload({ config });

  const email = claims.email.toLowerCase();
  const { docs } = await payload.find({
    collection: "admins",
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  });

  const admin = docs[0];
  if (!admin) {
    return buildErrorRedirect("not_an_admin");
  }

  const sessionToken = await signAdminSession({
    adminId: String(admin.id),
    email,
  });

  const next = nextEncoded ? decodeURIComponent(nextEncoded) : "/admin";
  const safeNext = next.startsWith("/admin") ? next : "/admin";

  const headers = new Headers();
  headers.append("Set-Cookie", buildSessionCookie(sessionToken));
  headers.append("Set-Cookie", buildClearShortLivedCookie(OAUTH_STATE_COOKIE));
  headers.append("Set-Cookie", buildClearShortLivedCookie(OAUTH_VERIFIER_COOKIE));
  headers.append("Set-Cookie", buildClearShortLivedCookie(OAUTH_NEXT_COOKIE));
  headers.set("Location", safeNext);

  return new Response(null, { status: 302, headers });
}
