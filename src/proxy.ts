import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  SESSION_COOKIE_NAME,
  verifyAdminSession,
} from "@lib/adminAuth/session";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

const USER = "default";
const PASSWORD = "RYutYTLNipCL37fg";
const SESSION_VALUE = Buffer.from(`${USER}:${PASSWORD}`).toString("base64");
const COOKIE_NAME = "basic-auth";

function challenge() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Secure Area"',
    },
  });
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifyAdminSession(token) : null;
    if (session) return NextResponse.next();

    const start = new URL("/api/admin/google/start", req.url);
    start.searchParams.set("next", pathname + req.nextUrl.search);
    return NextResponse.redirect(start);
  }

  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  if (req.cookies.get(COOKIE_NAME)?.value === SESSION_VALUE) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return challenge();
  }

  const received = authHeader.split(" ")[1];

  if (received !== SESSION_VALUE) {
    return challenge();
  }

  const response = NextResponse.next();
  response.cookies.set(COOKIE_NAME, SESSION_VALUE, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return response;
}
