import type { NextRequest } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export async function GET(request: NextRequest) {
  const language = request.nextUrl.searchParams.get("language");

  if (!language) {
    return Response.json({ error: "language is required" }, { status: 400 });
  }

  const payload = await getPayload({ config });

  const result = await payload.find({
    collection: "lessons",
    where: { language: { equals: language } },
    sort: "order",
    limit: 1000,
    depth: 1,
  });

  const lessons = result.docs.map((doc) => ({
    id: doc.id,
    sentence: doc.sentence,
    translation: doc.translation,
    tags: (doc.tags ?? [])
      .map((tag) => (typeof tag === "object" && tag !== null ? tag.name : null))
      .filter((name): name is string => Boolean(name)),
  }));

  return Response.json(lessons);
}
