"use client";

import { useQuery } from "@tanstack/react-query";
import { ILesson } from "@lib/types";

export class LessonFetchError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "LessonFetchError";
  }
}

async function fetchLesson(id: number): Promise<ILesson> {
  const response = await fetch(`/api/app-lessons/${id}`);
  if (!response.ok) {
    throw new LessonFetchError(response.status, "Failed to fetch lesson");
  }
  return response.json();
}

export default function useLesson(id: number | null) {
  return useQuery({
    queryKey: ["lesson", id],
    queryFn: () => fetchLesson(id!),
    enabled: id !== null,
    retry: (failureCount, error) => {
      if (
        error instanceof LessonFetchError &&
        (error.status === 401 || error.status === 403 || error.status === 404)
      ) {
        return false;
      }
      return failureCount < 3;
    },
  });
}
