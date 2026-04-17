import type { NextRequest } from "next/server";
import { db } from "@lib/db";
import { lessons } from "@lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const language = request.nextUrl.searchParams.get("language");

  if (!language) {
    return Response.json({ error: "language is required" }, { status: 400 });
  }

  const result = await db
    .select({
      id: lessons.id,
      sentence: lessons.sentence,
      translation: lessons.translation,
      tags: lessons.tags,
    })
    .from(lessons)
    .where(eq(lessons.language, language))
    .orderBy(asc(lessons.order));

  return Response.json(result);
}
