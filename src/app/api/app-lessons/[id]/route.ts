import type { NextRequest } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lessonId = parseInt(id, 10);

  if (isNaN(lessonId)) {
    return Response.json({ error: "Invalid lesson ID" }, { status: 400 });
  }

  const payload = await getPayload({ config });

  try {
    const doc = await payload.findByID({
      collection: "lessons",
      id: lessonId,
      depth: 1,
    });

    const lesson = {
      id: doc.id,
      sentence: doc.sentence,
      translation: doc.translation,
      audio: doc.audio,
      grammar: doc.grammar ?? [],
      liaisonTips: doc.liaisonTips ?? null,
      tags: (doc.tags ?? []).filter((t): t is string => typeof t === "string"),
    };

    return Response.json(lesson);
  } catch {
    return Response.json({ error: "Lesson not found" }, { status: 404 });
  }
}
