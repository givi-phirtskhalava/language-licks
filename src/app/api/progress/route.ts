import type { NextRequest } from "next/server";
import { db } from "@lib/db";
import { progress, lessons } from "@lib/db/schema";
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
        lessonId: progress.lessonId,
        phase: progress.phase,
        completed: progress.completed,
        completedAt: progress.completedAt,
        interval: progress.interval,
        nextReview: progress.nextReview,
        retired: progress.retired,
        writingBestTime: progress.writingBestTime,
        speakingBestTime: progress.speakingBestTime,
        writingStreak: progress.writingStreak,
        speakingStreak: progress.speakingStreak,
      })
      .from(progress)
      .innerJoin(lessons, eq(progress.lessonId, lessons.id))
      .where(
        and(eq(progress.userId, userId), eq(lessons.language, parsed.data))
      );

    const result: Record<number, Record<string, unknown>> = {};
    for (const row of rows) {
      result[row.lessonId] = {
        phase: row.phase,
        completed: row.completed,
        completedAt: row.completedAt ? row.completedAt.getTime() : null,
        interval: row.interval,
        nextReview: row.nextReview ? row.nextReview.getTime() : null,
        retired: row.retired,
        writingBestTime: row.writingBestTime,
        speakingBestTime: row.speakingBestTime,
        writingStreak: row.writingStreak,
        speakingStreak: row.speakingStreak,
      };
    }

    return Response.json({ progress: result });
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
    const { lessonId, ...data } = body;

    if (typeof lessonId !== "number") {
      return Response.json(
        { error: "lessonId must be a number" },
        { status: 400 }
      );
    }

    await db
      .insert(progress)
      .values({
        userId,
        lessonId,
        phase: data.phase ?? "lesson",
        completed: data.completed ?? false,
        completedAt: data.completedAt ? new Date(data.completedAt) : null,
        interval: data.interval ?? 86400000,
        nextReview: data.nextReview ? new Date(data.nextReview) : null,
        retired: data.retired ?? false,
        writingBestTime: data.writingBestTime ?? null,
        speakingBestTime: data.speakingBestTime ?? null,
        writingStreak: data.writingStreak ?? 0,
        speakingStreak: data.speakingStreak ?? 0,
      })
      .onConflictDoUpdate({
        target: [progress.userId, progress.lessonId],
        set: {
          phase: data.phase ?? "lesson",
          completed: data.completed ?? false,
          completedAt: data.completedAt ? new Date(data.completedAt) : null,
          interval: data.interval ?? 86400000,
          nextReview: data.nextReview ? new Date(data.nextReview) : null,
          retired: data.retired ?? false,
          writingBestTime: data.writingBestTime ?? null,
          speakingBestTime: data.speakingBestTime ?? null,
          writingStreak: data.writingStreak ?? 0,
          speakingStreak: data.speakingStreak ?? 0,
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
