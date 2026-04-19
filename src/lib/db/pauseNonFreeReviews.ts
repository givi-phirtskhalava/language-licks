import { getPayload } from "payload";
import config from "@payload-config";
import { db } from "@lib/db";
import { progress } from "@lib/db/schema";
import { eq, and, isNotNull, notInArray } from "drizzle-orm";

export async function pauseNonFreeReviews(userId: number) {
  const payload = await getPayload({ config });

  const result = await payload.find({
    collection: "lessons",
    where: { isFree: { equals: true } },
    pagination: false,
  });

  const freeLessonIds = result.docs.map((doc) => doc.id as number);

  if (freeLessonIds.length === 0) {
    await db
      .update(progress)
      .set({ nextReview: null })
      .where(
        and(eq(progress.userId, userId), isNotNull(progress.nextReview))
      );
    return;
  }

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
