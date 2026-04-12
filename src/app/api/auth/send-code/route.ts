import type { NextRequest } from "next/server";
import { isValidOrigin, generateOtp, storeOtp, sendOtpEmail } from "@lib/auth";

export async function POST(request: NextRequest) {
  if (!isValidOrigin(request)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const email = body.email?.trim().toLowerCase();

  if (!email) {
    return Response.json({ error: "Email is required" }, { status: 400 });
  }

  const code = generateOtp();
  await storeOtp(email, code);
  await sendOtpEmail(email, code);

  return Response.json({ sent: true });
}
