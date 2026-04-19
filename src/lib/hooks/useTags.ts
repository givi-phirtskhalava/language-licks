"use client";

import { useQuery } from "@tanstack/react-query";

export interface ITagGroup {
  id: string;
  label: string;
  tags: string[];
}

async function fetchTagGroups(language: string): Promise<ITagGroup[]> {
  const response = await fetch(
    `/api/app-tag-groups?language=${encodeURIComponent(language)}`
  );
  if (!response.ok) throw new Error("Failed to fetch tags");
  return response.json();
}

export default function useTags(language: string) {
  return useQuery({
    queryKey: ["tags", language],
    queryFn: () => fetchTagGroups(language),
  });
}
