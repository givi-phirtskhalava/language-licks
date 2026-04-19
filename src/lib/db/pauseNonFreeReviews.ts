import { getPayload } from "payload";
import config from "@payload-config";
import { db } from "@lib/db";
import { progress } from "@lib/db/schema";
import { eq, and, isNotNull, notInArray } from "drizzle-orm";
import { FREE_LESSON_COUNT } from "@lib/projectConfig";

export async function pauseNonFreeReviews(userId: number) {
  const payload = await getPayload({ config });

  const result = await payload.find({
    collection: "lessons",
    sort: "order",
    limit: FREE_LESSON_COUNT,
    pagination: false,
  });

  const freeLessonIds = result.docs.map((doc) => doc.id as number);

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
