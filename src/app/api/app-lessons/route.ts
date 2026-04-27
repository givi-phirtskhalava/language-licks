import type { NextRequest } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { requirePremium } from "@lib/auth";

export async function GET(request: NextRequest) {
  const language = request.nextUrl.searchParams.get("language");

  if (!language) {
    return Response.json({ error: "language is required" }, { status: 400 });
  }

  let isPremium = false;
  try {
    await requirePremium();
    isPremium = true;
  } catch {
    isPremium = false;
  }

  try {
    const payload = await getPayload({ config });

    const result = await payload.find({
      collection: "lessons",
      where: {
        and: [
          { language: { equals: language } },
          { _status: { equals: "published" } },
        ],
      },
      sort: ["cefr", "order", "id"],
      limit: 1000,
      depth: 0,
    });

    const lessons = result.docs.map((doc) => ({
      id: doc.id,
      sentence: doc.sentence,
      translation: doc.isFree || isPremium ? doc.translation : "",
      tags: (doc.tags ?? []).filter((t): t is string => typeof t === "string"),
      isFree: !!doc.isFree,
      cefr: doc.cefr ?? "A1",
    }));

    return Response.json(lessons);
  } catch (error) {
    console.error("Failed to fetch lessons:", error);
    return Response.json(
      { error: "Service temporarily unavailable" },
      { status: 503 }
    );
  }
}
