import { db } from "@lib/db";
import { progress } from "@lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthError } from "@lib/auth";

export async function POST() {
  try {
    const { userId } = await requireAuth();
    await db.delete(progress).where(eq(progress.userId, userId));
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
