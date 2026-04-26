import { Google, generateState, generateCodeVerifier } from "arctic";
import { createRemoteJWKSet, jwtVerify } from "jose";

const GOOGLE_ISSUER = "https://accounts.google.com";
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";

const jwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

export function getGoogleClient(): Google {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectURI = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectURI) {
    throw new Error(
      "Missing Google OAuth env vars: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI",
    );
  }

  return new Google(clientId, clientSecret, redirectURI);
}

export { generateState, generateCodeVerifier };

export interface IGoogleIdClaims {
  sub: string;
  email: string;
  email_verified: boolean;
  hd?: string;
  name?: string;
  picture?: string;
}

export async function verifyGoogleIdToken(
  idToken: string,
): Promise<IGoogleIdClaims> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_OAUTH_CLIENT_ID is not set");

  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: GOOGLE_ISSUER,
    audience: clientId,
  });

  if (
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.email_verified !== "boolean"
  ) {
    throw new Error("ID token missing required claims");
  }

  if (!payload.email_verified) {
    throw new Error("Google email is not verified");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    email_verified: payload.email_verified,
    hd: typeof payload.hd === "string" ? payload.hd : undefined,
    name: typeof payload.name === "string" ? payload.name : undefined,
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
  };
}

export function isWorkspaceDomainAllowed(claims: IGoogleIdClaims): boolean {
  const allowed = process.env.GOOGLE_WORKSPACE_DOMAIN;
  if (!allowed) return true;
  return claims.hd === allowed;
}
