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

  if (doc._status !== "published") {
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

  const audioFiles = await payload.find({
    collection: "audio-files",
    where: { lesson: { equals: lessonId } },
    depth: 2,
    limit: 100,
    pagination: false,
  });

  type Recording = {
    voiceActor: {
      id: number;
      name: string;
      accent: string;
      sampleUrl: string | null;
    };
    normalUrl: string | null;
    slowUrl: string | null;
  };

  const grouped = new Map<number, Recording>();

  for (const af of audioFiles.docs) {
    const actor = af.voiceActor;
    if (!actor || typeof actor !== "object") continue;
    if (actor._status !== "published") continue;

    const url = typeof af.url === "string" ? af.url : null;
    if (!url) continue;

    let entry = grouped.get(actor.id);
    if (!entry) {
      const sample = actor.sample;
      const sampleUrl =
        sample && typeof sample === "object" && typeof sample.url === "string"
          ? sample.url
          : null;
      entry = {
        voiceActor: {
          id: actor.id,
          name: actor.name,
          accent: actor.accent,
          sampleUrl,
        },
        normalUrl: null,
        slowUrl: null,
      };
      grouped.set(actor.id, entry);
    }

    if (af.speed === "normal") entry.normalUrl = url;
    else if (af.speed === "slow") entry.slowUrl = url;
  }

  const lesson = {
    id: doc.id,
    sentence: doc.sentence,
    translation: doc.translation,
    context: doc.context ?? null,
    recordings: Array.from(grouped.values()),
    grammar: doc.grammar ?? [],
    liaisonTips: doc.liaisonTips ?? null,
    tags: (doc.tags ?? []).filter((t): t is string => typeof t === "string"),
    isFree: !!doc.isFree,
  };

  return Response.json(lesson);
}
