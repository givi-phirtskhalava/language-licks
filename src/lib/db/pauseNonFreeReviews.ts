import { db } from "@lib/db";
import { progress, lessons } from "@lib/db/schema";
import { eq, and, isNotNull, notInArray } from "drizzle-orm";
import { FREE_LESSON_COUNT } from "@lib/projectConfig";

export async function pauseNonFreeReviews(userId: number) {
  const freeLessonRows = await db
    .select({ id: lessons.id })
    .from(lessons)
    .orderBy(lessons.order)
    .limit(FREE_LESSON_COUNT);

  const freeLessonIds = freeLessonRows.map((r) => r.id);

  if (freeLessonIds.length === 0) return;

  await db
    .update(progress)
    .set({ nextReview: null })
    .where(
      and(
        eq(progress.userId, userId),
        notInArray(progress.lessonId, freeLessonIds),
        isNotNull(progress.nextReview)
      )
    );
}
