import type { NextRequest } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { requirePremium, AuthError } from "@lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lessonId = parseInt(id, 10);

  if (isNaN(lessonId)) {
    return Response.json({ error: "Invalid lesson ID" }, { status: 400 });
  }

  let payload;
  try {
    payload = await getPayload({ config });
  } catch (error) {
    console.error("Failed to connect to service:", error);
    return Response.json(
      { error: "Service temporarily unavailable" },
      { status: 503 }
    );
  }

  let doc;
  try {
    doc = await payload.findByID({
      collection: "lessons",
      id: lessonId,
      depth: 1,
    });
  } catch {
    return Response.json({ error: "Lesson not found" }, { status: 404 });
  }

  if (!doc.isFree) {
    try {
      await requirePremium();
    } catch (error) {
      if (error instanceof AuthError) {
        return Response.json(
          { error: error.message },
          { status: error.status }
        );
      }
      throw error;
    }
  }

  const lesson = {
    id: doc.id,
    sentence: doc.sentence,
    translation: doc.translation,
    audio: doc.audio,
    grammar: doc.grammar ?? [],
    liaisonTips: doc.liaisonTips ?? null,
    tags: (doc.tags ?? []).filter((t): t is string => typeof t === "string"),
    isFree: !!doc.isFree,
  };

  return Response.json(lesson);
}
