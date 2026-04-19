import type { NextRequest } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

interface ITagGroupResponse {
  id: string;
  label: string;
  tags: string[];
}

export async function GET(request: NextRequest) {
  const language = request.nextUrl.searchParams.get("language");

  if (!language) {
    return Response.json({ error: "language is required" }, { status: 400 });
  }

  const payload = await getPayload({ config });

  const result = await payload.find({
    collection: "tag-groups",
    where: { language: { equals: language } },
    limit: 1,
  });

  const doc = result.docs[0];

  if (!doc) {
    return Response.json([] satisfies ITagGroupResponse[]);
  }

  const groups: ITagGroupResponse[] = (doc.groups ?? []).map((group, index) => ({
    id: group.id ?? String(index),
    label: group.name,
    tags: (group.tags ?? [])
      .map((tag) => tag.name)
      .filter((name): name is string => Boolean(name)),
  }));

  return Response.json(groups);
}
