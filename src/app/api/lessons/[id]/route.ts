import type { NextRequest } from "next/server";
import { db } from "@lib/db";
import { lessons } from "@lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lessonId = parseInt(id, 10);

  if (isNaN(lessonId)) {
    return Response.json({ error: "Invalid lesson ID" }, { status: 400 });
  }

  const result = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);

  if (result.length === 0) {
    return Response.json({ error: "Lesson not found" }, { status: 404 });
  }

  return Response.json(result[0]);
}
