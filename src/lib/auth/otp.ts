import { db } from "@lib/db";
import { verificationCodes } from "@lib/db/schema";
import { eq, and, gt } from "drizzle-orm";

export function generateOtp(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, "0");
}

export async function hashOtp(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function storeOtp(email: string, code: string) {
  const codeHash = await hashOtp(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db
    .delete(verificationCodes)
    .where(eq(verificationCodes.email, email));

  await db.insert(verificationCodes).values({
    email,
    codeHash,
    expiresAt,
  });
}

export async function verifyOtp(
  email: string,
  code: string
): Promise<boolean> {
  const codeHash = await hashOtp(code);

  const results = await db
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.email, email),
        eq(verificationCodes.codeHash, codeHash),
        gt(verificationCodes.expiresAt, new Date())
      )
    )
    .limit(1);

  if (results.length === 0) return false;

  await db
    .delete(verificationCodes)
    .where(eq(verificationCodes.email, email));

  return true;
}
