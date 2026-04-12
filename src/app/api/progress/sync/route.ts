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
    }

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
