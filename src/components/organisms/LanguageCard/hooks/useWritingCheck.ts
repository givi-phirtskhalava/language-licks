"use client";

import { useRef, useState } from "react";

export type WriteWordStatus = "correct" | "warning" | "error" | "missing";

export interface WriteWordResult {
  expected: string;
  actual: string | null;
  status: WriteWordStatus;
}

function stripPunctuation(word: string): string {
  return word.replace(/[^a-zA-ZàâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ']/g, "");
}

export function compareWriting(
  expected: string,
  actual: string,
): WriteWordResult[] {
  const expTrimmed = expected.replace(/[.,!?;:…]+$/, "");
  const actTrimmed = actual.replace(/[.,!?;:…]+$/, "");

  const expWords = expTrimmed.split(/\s+/).filter(Boolean);
  const actWords = actTrimmed.split(/\s+/).filter(Boolean);

  const results: WriteWordResult[] = [];
  const len = Math.max(expWords.length, actWords.length);

  for (let i = 0; i < len; i++) {
    const exp = expWords[i];
    const act = actWords[i];

    if (!exp) continue;

    if (!act) {
      results.push({ expected: exp, actual: null, status: "missing" });
      continue;
    }

    if (exp === act) {
      results.push({ expected: exp, actual: act, status: "correct" });
      continue;
    }

    const expStripped = stripPunctuation(exp);
    const actStripped = stripPunctuation(act);

    if (expStripped === actStripped) {
      results.push({ expected: exp, actual: act, status: "warning" });
      continue;
    }

    if (expStripped.toLowerCase() === actStripped.toLowerCase()) {
      results.push({ expected: exp, actual: act, status: "warning" });
      continue;
    }

    results.push({ expected: exp, actual: act, status: "error" });
  }

  return results;
}

interface UseWritingCheckReturn {
  result: WriteWordResult[] | null;
  hasErrors: boolean;
  hasWarnings: boolean;
  isPass: boolean;
  check: (expected: string, input: string) => boolean;
  clear: () => void;
}

export default function useWritingCheck(): UseWritingCheckReturn {
  const [result, setResult] = useState<WriteWordResult[] | null>(null);
  const resultRef = useRef<WriteWordResult[] | null>(null);

  function check(expected: string, input: string): boolean {
    const results = compareWriting(expected, input);
    setResult(results);
    resultRef.current = results;
    const hasErrors = results.some(
      (r) => r.status === "error" || r.status === "missing",
    );
    return !hasErrors;
  }

  function clear() {
    setResult(null);
    resultRef.current = null;
  }

  const hasErrors =
    result?.some((r) => r.status === "error" || r.status === "missing") ??
    false;
  const hasWarnings = result?.some((r) => r.status === "warning") ?? false;
  const isPass = result !== null && !hasErrors;

  return { result, hasErrors, hasWarnings, isPass, check, clear };
}
