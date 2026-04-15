"use client";

import { useQuery } from "@tanstack/react-query";
import type { ISpeechCredits } from "@lib/types";

async function fetchSpeechCredits(): Promise<ISpeechCredits | null> {
  const res = await fetch("/api/speech/credits");
  if (!res.ok) return null;
  return res.json();
}

export default function useSpeechCredits() {
  return useQuery({
    queryKey: ["speech", "credits"],
    queryFn: fetchSpeechCredits,
    staleTime: Infinity,
  });
}
