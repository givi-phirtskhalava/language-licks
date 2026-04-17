import { SignJWT } from "jose";
import { requirePremium, AuthError } from "@lib/auth";

const TOKEN_TTL_SEC = 15 * 60;

export async function POST() {
  try {
    const { userId } = await requirePremium();

    const secret = process.env.WHISPER_JWT_SECRET;

    if (!secret) {
      return Response.json(
        { error: "Whisper service not configured" },
        { status: 503 }
      );
    }

    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(String(userId))
      .setIssuedAt()
      .setExpirationTime(`${TOKEN_TTL_SEC}s`)
      .sign(new TextEncoder().encode(secret));

    return Response.json({
      token,
      expiresInSec: TOKEN_TTL_SEC,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
