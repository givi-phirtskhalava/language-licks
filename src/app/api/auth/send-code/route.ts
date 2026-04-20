import type { NextRequest } from "next/server";
import { isValidOrigin, generateOtp, storeOtp, sendOtpEmail } from "@lib/auth";
import { verifyTurnstileToken } from "@lib/turnstile";

export async function POST(request: NextRequest) {
  if (!isValidOrigin(request)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const email = body.email?.trim().toLowerCase();
  const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken : undefined;

  if (!email) {
    return Response.json({ error: "Email is required" }, { status: 400 });
  }

  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  const verified = await verifyTurnstileToken(turnstileToken, ip);
  if (!verified) {
    return Response.json({ error: "Captcha verification failed" }, { status: 400 });
  }

  const code = generateOtp();
  await storeOtp(email, code);
  await sendOtpEmail(email, code);

  return Response.json({ sent: true });
}
