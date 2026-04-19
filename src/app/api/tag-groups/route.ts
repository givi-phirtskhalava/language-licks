import { getPayload } from "payload";
import config from "@payload-config";

export type TTagGroupId = "tenses" | "topics" | "grammar";

interface ITagGroupResponse {
  id: TTagGroupId;
  label: string;
  tags: string[];
}

const GROUP_LABELS: Record<TTagGroupId, string> = {
  tenses: "Tenses & Moods",
  topics: "Topics",
  grammar: "Grammar",
};

const GROUP_ORDER: TTagGroupId[] = ["tenses", "topics", "grammar"];

export async function GET() {
  const payload = await getPayload({ config });

  const result = await payload.find({
    collection: "tags",
    sort: "order",
    limit: 1000,
  });

  const byGroup: Record<TTagGroupId, string[]> = {
    tenses: [],
    topics: [],
    grammar: [],
  };

  for (const tag of result.docs) {
    const group = tag.group as TTagGroupId;
    if (byGroup[group]) byGroup[group].push(tag.name);
  }

  const groups: ITagGroupResponse[] = GROUP_ORDER.map((id) => ({
    id,
    label: GROUP_LABELS[id],
    tags: byGroup[id],
  }));

  return Response.json(groups);
}
