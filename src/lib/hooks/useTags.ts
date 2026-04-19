"use client";

import { useQuery } from "@tanstack/react-query";

export type TTagGroupId = "tenses" | "topics" | "grammar";

export interface ITagGroup {
  id: TTagGroupId;
  label: string;
  tags: string[];
}

async function fetchTagGroups(): Promise<ITagGroup[]> {
  const response = await fetch("/api/tag-groups");
  if (!response.ok) throw new Error("Failed to fetch tags");
  return response.json();
}

export default function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: fetchTagGroups,
  });
}
