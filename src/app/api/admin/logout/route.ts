import { buildClearSessionCookie } from "@lib/adminAuth/session";

export async function GET() {
  const headers = new Headers();
  headers.append("Set-Cookie", buildClearSessionCookie());
  headers.set("Location", "/");
  return new Response(null, { status: 302, headers });
}

export async function POST() {
  const headers = new Headers();
  headers.append("Set-Cookie", buildClearSessionCookie());
  headers.set("Location", "/");
  return new Response(null, { status: 302, headers });
}
