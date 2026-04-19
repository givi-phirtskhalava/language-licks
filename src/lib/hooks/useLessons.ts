"use client";

import { useQuery } from "@tanstack/react-query";
import { ILessonListItem } from "@lib/types";
import { TLanguageId } from "@lib/projectConfig";

async function fetchLessons(language: TLanguageId): Promise<ILessonListItem[]> {
  const response = await fetch(`/api/app-lessons?language=${language}`);
  if (!response.ok) throw new Error("Failed to fetch lessons");
  return response.json();
}

export default function useLessons(language: TLanguageId) {
  return useQuery({
    queryKey: ["lessons", language],
    queryFn: () => fetchLessons(language),
  });
}
