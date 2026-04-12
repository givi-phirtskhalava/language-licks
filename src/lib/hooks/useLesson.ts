"use client";

import { useQuery } from "@tanstack/react-query";
import { ILesson } from "@lib/types";

async function fetchLesson(id: number): Promise<ILesson> {
  const response = await fetch(`/api/lessons/${id}`);
  if (!response.ok) throw new Error("Failed to fetch lesson");
  return response.json();
}

export default function useLesson(id: number | null) {
  return useQuery({
    queryKey: ["lesson", id],
    queryFn: () => fetchLesson(id!),
    enabled: id !== null,
  });
}
