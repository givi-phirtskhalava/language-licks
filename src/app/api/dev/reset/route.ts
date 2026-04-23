import { db } from "@lib/db";
import { progress, dailyActivity } from "@lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthError } from "@lib/auth";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { userId } = await requireAuth();
    await db.delete(progress).where(eq(progress.userId, userId));
    await db.delete(dailyActivity).where(eq(dailyActivity.userId, userId));
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
