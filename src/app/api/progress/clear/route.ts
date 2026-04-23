import type { NextRequest } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { db } from "@lib/db";
import { progress } from "@lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { requireAuth, AuthError } from "@lib/auth";
import { languageIdSchema } from "@lib/validation";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json().catch(() => ({}));
    const parsed = languageIdSchema.safeParse(body.language);

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
      depth: 0,
    });
    const lessonIds = lessonsResult.docs.map((doc) => doc.id as number);

    if (lessonIds.length > 0) {
      await db
        .delete(progress)
        .where(
          and(
            eq(progress.userId, userId),
            inArray(progress.lessonId, lessonIds)
          )
        );
    }

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
