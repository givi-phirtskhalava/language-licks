"use client";

import { useQuery } from "@tanstack/react-query";
import type { ISpeechUsage } from "@lib/types";

async function fetchSpeechUsage(): Promise<ISpeechUsage | null> {
  const res = await fetch("/api/speech/usage");
  if (!res.ok) return null;
  return res.json();
}

export default function useSpeechUsage() {
  return useQuery({
    queryKey: ["speech", "usage"],
    queryFn: fetchSpeechUsage,
    staleTime: Infinity,
  });
}
