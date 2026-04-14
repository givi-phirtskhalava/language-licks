import type { NextRequest } from "next/server";
import { db } from "@lib/db";
import { dailyActivity } from "@lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthError } from "@lib/auth";
import { languageIdSchema } from "@lib/validation";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const language = request.nextUrl.searchParams.get("language");
    const parsed = languageIdSchema.safeParse(language);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid language parameter" },
        { status: 400 }
      );
    }

    const rows = await db
      .select({
        dateKey: dailyActivity.dateKey,
        lessons: dailyActivity.lessons,
        reviews: dailyActivity.reviews,
      })
      .from(dailyActivity)
      .where(
        and(
          eq(dailyActivity.userId, userId),
          eq(dailyActivity.language, parsed.data)
        )
      );

    const log: Record<string, { l: number; r: number }> = {};
    for (const row of rows) {
      log[row.dateKey] = { l: row.lessons, r: row.reviews };
    }

    return Response.json({ log });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const { language, dateKey, lessons, reviews } = body;

    const parsed = languageIdSchema.safeParse(language);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid language parameter" },
        { status: 400 }
      );
    }

    if (typeof dateKey !== "string" || dateKey.length !== 6) {
      return Response.json(
        { error: "Invalid dateKey" },
        { status: 400 }
      );
    }

    await db
      .insert(dailyActivity)
      .values({
        userId,
        language: parsed.data,
        dateKey,
        lessons: lessons ?? 0,
        reviews: reviews ?? 0,
      })
      .onConflictDoUpdate({
        target: [dailyActivity.userId, dailyActivity.language, dailyActivity.dateKey],
        set: {
          lessons: lessons ?? 0,
          reviews: reviews ?? 0,
        },
      });

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
