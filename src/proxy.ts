import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Configure which routes to protect (all routes by default)
export const config = {
  matcher: [
    //  match everything
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

export function proxy(req: NextRequest) {
  // Check for specific paths with custom authentication
  if (process.env.NODE_ENV !== "development") {
    const basicAuthUsers = [["default", "RYutYTLNipCL37fg"]];
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return new NextResponse("Authentication required", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Secure Area"',
        },
      });
    }

    const auth = authHeader.split(" ")[1];
    const [user, pass] = Buffer.from(auth, "base64").toString().split(":");

    const isValid = basicAuthUsers.some(
      ([username, password]) => user === username && pass === password
    );

    if (!isValid) {
      return new NextResponse("Invalid credentials", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Secure Area"',
        },
      });
    }

    return NextResponse.next();
  }
}
