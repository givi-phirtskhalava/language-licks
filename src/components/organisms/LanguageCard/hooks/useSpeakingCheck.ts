"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  useSpeechToText,
  ISpeechScoreResult,
  GOP_PASS_THRESHOLD,
  didPass,
} from "@/lib/useSpeechToText";
import { IWriteWordResult } from "@/components/organisms/LanguageCard/hooks/useWritingCheck";

interface ISpeakResult {
  correct: boolean;
  words: IWriteWordResult[];
}

function wordsFromScore(score: ISpeechScoreResult): IWriteWordResult[] {
  if (!score.perWord) return [];

  const extrasByIndex = new Map<number, string[]>();
  for (const extra of score.extraSegments ?? []) {
    const arr = extrasByIndex.get(extra.afterWordIndex) ?? [];
    arr.push(extra.heardIpa);
    extrasByIndex.set(extra.afterWordIndex, arr);
  }

  const results: IWriteWordResult[] = [];
  for (const heard of extrasByIndex.get(-1) ?? []) {
    results.push({ expected: "", actual: `[${heard}]`, status: "extra" });
  }
  score.perWord.forEach((w, i) => {
    const passed = w.gopScore >= GOP_PASS_THRESHOLD;
    results.push(
      passed
        ? { expected: w.word, actual: w.word, status: "correct" }
        : { expected: w.word, actual: null, status: "missing" },
    );
    for (const heard of extrasByIndex.get(i) ?? []) {
      results.push({ expected: "", actual: `[${heard}]`, status: "extra" });
    }
  });
  return results;
}

interface IUseSpeakingCheckReturn {
  result: ISpeakResult | null;
  isListening: boolean;
  isProcessing: boolean;
  error: string | null;
  toggle: () => Promise<void>;
  clearResult: () => void;
}

export default function useSpeakingCheck(
  lang: string,
  sentence: string,
  onCorrect?: () => void,
  onWrong?: () => void,
): IUseSpeakingCheckReturn {
  const {
    scoreResult,
    resultId,
    isListening,
    isProcessing,
    error,
    start,
    stop,
  } = useSpeechToText(lang.slice(0, 2));

  const [result, setResult] = useState<ISpeakResult | null>(null);
  const processedResultId = useRef(0);

  useEffect(() => {
    if (resultId > processedResultId.current) {
      processedResultId.current = resultId;

      if (!scoreResult?.perWord) return;

      console.log(`[speech] target ipa: ${scoreResult.expectedIpa ?? ""}`);
      console.log(`[speech] heard  ipa: ${scoreResult.heardIpa ?? ""}`);
      console.table(
        scoreResult.perWord.map((w) => ({
          word: w.word,
          gop: w.gopScore,
          pass: w.gopScore >= GOP_PASS_THRESHOLD,
          expectedIpa: w.expectedIpa ?? "",
          heardIpa: w.heardIpa ?? "",
        })),
      );

      const words = wordsFromScore(scoreResult);
      const passed = didPass(scoreResult);

      setResult({ correct: passed, words });
      if (passed) {
        onCorrect?.();
      } else {
        onWrong?.();
      }
    }
  }, [resultId, scoreResult]);

  const toggle = useCallback(async () => {
    if (isProcessing) return;

    if (isListening) {
      stop();
      return;
    }

    setResult(null);
    const started = await start(sentence);
    if (!started && !error) {
      toast.error(
        "Microphone access is blocked. Please allow it in your browser settings.",
        { duration: 4000 },
      );
    }
  }, [isProcessing, isListening, start, stop, error, sentence]);

  function clearResult() {
    setResult(null);
  }

  return {
    result,
    isListening,
    isProcessing,
    error,
    toggle,
    clearResult,
  };
}
