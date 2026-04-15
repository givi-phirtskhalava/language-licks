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
        firstCompletedAt: progress.firstCompletedAt,
        interval: progress.interval,
        nextReview: progress.nextReview,
        retired: progress.retired,
        writingBestTime: progress.writingBestTime,
        speakingBestTime: progress.speakingBestTime,
        writingStreak: progress.writingStreak,
        speakingStreak: progress.speakingStreak,
        reviewPassCount: progress.reviewPassCount,
        reviewFailCount: progress.reviewFailCount,
        consecutiveFails: progress.consecutiveFails,
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
        firstCompletedAt: row.firstCompletedAt
          ? row.firstCompletedAt.getTime()
          : null,
        interval: row.interval,
        nextReview: row.nextReview ?? null,
        retired: row.retired,
        writingBestTime: row.writingBestTime,
        speakingBestTime: row.speakingBestTime,
        writingStreak: row.writingStreak,
        speakingStreak: row.speakingStreak,
        reviewPassCount: row.reviewPassCount,
        reviewFailCount: row.reviewFailCount,
        consecutiveFails: row.consecutiveFails,
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

    const values = {
      userId,
      lessonId,
      phase: data.phase ?? "lesson",
      completed: data.completed ?? false,
      completedAt: data.completedAt ? new Date(data.completedAt) : null,
      firstCompletedAt: data.firstCompletedAt
        ? new Date(data.firstCompletedAt)
        : null,
      interval: data.interval ?? 1,
      nextReview: data.nextReview ?? null,
      retired: data.retired ?? false,
      writingBestTime: data.writingBestTime ?? null,
      speakingBestTime: data.speakingBestTime ?? null,
      writingStreak: data.writingStreak ?? 0,
      speakingStreak: data.speakingStreak ?? 0,
      reviewPassCount: data.reviewPassCount ?? 0,
      reviewFailCount: data.reviewFailCount ?? 0,
      consecutiveFails: data.consecutiveFails ?? 0,
    };

    await db
      .insert(progress)
      .values(values)
      .onConflictDoUpdate({
        target: [progress.userId, progress.lessonId],
        set: {
          phase: values.phase,
          completed: values.completed,
          completedAt: values.completedAt,
          firstCompletedAt: values.firstCompletedAt,
          interval: values.interval,
          nextReview: values.nextReview,
          retired: values.retired,
          writingBestTime: values.writingBestTime,
          speakingBestTime: values.speakingBestTime,
          writingStreak: values.writingStreak,
          speakingStreak: values.speakingStreak,
          reviewPassCount: values.reviewPassCount,
          reviewFailCount: values.reviewFailCount,
          consecutiveFails: values.consecutiveFails,
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
