import type { NextRequest } from "next/server";
import { db } from "@lib/db";
import { dailyActivity } from "@lib/db/schema";
import { requireAuth, AuthError } from "@lib/auth";
import { languageIdSchema } from "@lib/validation";
import { TDailyLog } from "@lib/types";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();

    const parsed = languageIdSchema.safeParse(body.language);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid language parameter" },
        { status: 400 }
      );
    }

    const log: TDailyLog = body.log;
    if (!log || typeof log !== "object") {
      return Response.json(
        { error: "log must be an object" },
        { status: 400 }
      );
    }

    const entries = Object.entries(log);
    for (const [dateKey, entry] of entries) {
      if (dateKey.length !== 6) continue;

      await db
        .insert(dailyActivity)
        .values({
          userId,
          language: parsed.data,
          dateKey,
          lessons: entry.l ?? 0,
          reviews: entry.r ?? 0,
        })
        .onConflictDoUpdate({
          target: [
            dailyActivity.userId,
            dailyActivity.language,
            dailyActivity.dateKey,
          ],
          set: {
            lessons: entry.l ?? 0,
            reviews: entry.r ?? 0,
          },
        });
    }

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
