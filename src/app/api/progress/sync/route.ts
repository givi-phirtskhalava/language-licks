import type { NextRequest } from "next/server";
import { db } from "@lib/db";
import { progress } from "@lib/db/schema";
import { requireAuth, AuthError } from "@lib/auth";
import { languageIdSchema } from "@lib/validation";
import { ILessonProgress } from "@lib/types";

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

    const progressMap: Record<string, ILessonProgress> = body.progress;
    if (!progressMap || typeof progressMap !== "object") {
      return Response.json(
        { error: "progress must be an object" },
        { status: 400 }
      );
    }

    const entries = Object.entries(progressMap);
    for (const [lessonIdStr, data] of entries) {
      const lessonId = Number(lessonIdStr);
      if (Number.isNaN(lessonId)) continue;

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
        speakingUnlocked: data.speakingUnlocked ?? false,
        lessonLearned: data.lessonLearned ?? false,
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
            speakingUnlocked: values.speakingUnlocked,
            lessonLearned: values.lessonLearned,
            reviewPassCount: values.reviewPassCount,
            reviewFailCount: values.reviewFailCount,
            consecutiveFails: values.consecutiveFails,
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
