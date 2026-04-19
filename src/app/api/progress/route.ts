import type { NextRequest } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { db } from "@lib/db";
import { progress } from "@lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
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

    const payload = await getPayload({ config });
    const lessonsResult = await payload.find({
      collection: "lessons",
      where: { language: { equals: parsed.data } },
      limit: 10000,
      pagination: false,
    });
    const lessonIds = lessonsResult.docs.map((doc) => doc.id as number);

    const rows =
      lessonIds.length === 0
        ? []
        : await db
            .select({
              lessonId: progress.lessonId,
              phase: progress.phase,
              completed: progress.completed,
              completedAt: progress.completedAt,
              firstCompletedAt: progress.firstCompletedAt,
              interval: progress.interval,
              nextReview: progress.nextReview,
              retired: progress.retired,
              speakingUnlocked: progress.speakingUnlocked,
              lessonLearned: progress.lessonLearned,
              reviewPassCount: progress.reviewPassCount,
              reviewFailCount: progress.reviewFailCount,
              consecutiveFails: progress.consecutiveFails,
            })
            .from(progress)
            .where(
              and(
                eq(progress.userId, userId),
                inArray(progress.lessonId, lessonIds)
              )
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
        nextReview: row.nextReview ? row.nextReview.slice(0, 10) : null,
        retired: row.retired,
        speakingUnlocked: row.speakingUnlocked,
        lessonLearned: row.lessonLearned,
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

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
