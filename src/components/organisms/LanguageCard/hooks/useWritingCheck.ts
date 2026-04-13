"use client";

import { useRef, useState } from "react";

export type TWriteWordStatus = "correct" | "warning" | "error" | "missing" | "extra";

export interface IWriteWordResult {
  expected: string;
  actual: string | null;
  status: TWriteWordStatus;
}

function stripPunctuation(word: string): string {
  return word.replace(/[^a-zA-ZàâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ']/g, "");
}

function stripAccents(word: string): string {
  return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function classifyWord(exp: string, act: string): TWriteWordStatus {
  if (exp === act) return "correct";
  const expStripped = stripPunctuation(exp);
  const actStripped = stripPunctuation(act);
  if (expStripped === actStripped) return "warning";
  if (expStripped.toLowerCase() === actStripped.toLowerCase()) return "warning";
  if (stripAccents(expStripped).toLowerCase() === stripAccents(actStripped).toLowerCase())
    return "warning";
  return "error";
}

function wordsMatch(exp: string, act: string): boolean {
  const status = classifyWord(exp, act);
  return status === "correct" || status === "warning";
}

export function compareWriting(
  expected: string,
  actual: string,
): IWriteWordResult[] {
  const expTrimmed = expected.replace(/[.,!?;:…]+$/, "");
  const actTrimmed = actual.replace(/[.,!?;:…]+$/, "");

  const expWords = expTrimmed.split(/\s+/).filter(Boolean);
  const actWords = actTrimmed.split(/\s+/).filter(Boolean);

  const m = expWords.length;
  const n = actWords.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (wordsMatch(expWords[i - 1], actWords[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] =
          1 +
          Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const results: IWriteWordResult[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      wordsMatch(expWords[i - 1], actWords[j - 1])
    ) {
      const status = classifyWord(expWords[i - 1], actWords[j - 1]);
      results.unshift({
        expected: expWords[i - 1],
        actual: actWords[j - 1],
        status,
      });
      i--;
      j--;
    } else if (
      i > 0 &&
      j > 0 &&
      dp[i][j] === dp[i - 1][j - 1] + 1
    ) {
      results.unshift({
        expected: expWords[i - 1],
        actual: actWords[j - 1],
        status: "error",
      });
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      results.unshift({
        expected: expWords[i - 1],
        actual: null,
        status: "missing",
      });
      i--;
    } else {
      results.unshift({
        expected: "",
        actual: actWords[j - 1],
        status: "extra",
      });
      j--;
    }
  }

  return results;
}

interface ICheckResult {
  passed: boolean;
  onlyAccentIssues: boolean;
}

interface IUseWritingCheckReturn {
  result: IWriteWordResult[] | null;
  hasErrors: boolean;
  hasWarnings: boolean;
  isPass: boolean;
  onlyAccentIssues: boolean;
  check: (expected: string, input: string) => ICheckResult;
  clear: () => void;
}

export default function useWritingCheck(): IUseWritingCheckReturn {
  const [result, setResult] = useState<IWriteWordResult[] | null>(null);
  const resultRef = useRef<IWriteWordResult[] | null>(null);

  function check(expected: string, input: string): ICheckResult {
    const results = compareWriting(expected, input);
    setResult(results);
    resultRef.current = results;
    const hasErrors = results.some(
      (r) =>
        r.status === "error" ||
        r.status === "missing" ||
        r.status === "extra",
    );
    const hasWarnings = results.some((r) => r.status === "warning");
    const onlyAccentIssues = !hasErrors && hasWarnings;
    return { passed: !hasErrors && !hasWarnings, onlyAccentIssues };
  }

  function clear() {
    setResult(null);
    resultRef.current = null;
  }

  const hasErrors =
    result?.some(
      (r) =>
        r.status === "error" ||
        r.status === "missing" ||
        r.status === "extra",
    ) ?? false;
  const hasWarnings = result?.some((r) => r.status === "warning") ?? false;
  const isPass = result !== null && !hasErrors && !hasWarnings;
  const onlyAccentIssues = result !== null && !hasErrors && hasWarnings;

  return {
    result,
    hasErrors,
    hasWarnings,
    isPass,
    onlyAccentIssues,
    check,
    clear,
  };
}
