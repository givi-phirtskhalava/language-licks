"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { compareWords, WordComparison } from "@/lib/compareText";

interface SpeakResult {
  correct: boolean;
  words: WordComparison[];
}

interface UseSpeakingCheckReturn {
  result: SpeakResult | null;
  isListening: boolean;
  isProcessing: boolean;
  isSupported: boolean;
  error: string | null;
  toggle: () => Promise<void>;
  clearResult: () => void;
}

export default function useSpeakingCheck(
  lang: string,
  sentence: string,
  onCorrect?: () => void,
  onWrong?: () => void,
): UseSpeakingCheckReturn {
  const {
    transcript,
    resultId,
    isListening,
    isProcessing,
    error,
    isSupported,
    start,
    stop,
  } = useSpeechRecognition(lang);

  const [result, setResult] = useState<SpeakResult | null>(null);
  const processedResultId = useRef(0);

  useEffect(() => {
    if (resultId > processedResultId.current && transcript) {
      processedResultId.current = resultId;
      const comparison = compareWords(sentence, transcript);
      const passed = comparison.score === 1;
      setResult({ correct: passed, words: comparison.words });
      if (passed) {
        onCorrect?.();
      } else {
        onWrong?.();
      }
    }
  }, [resultId, transcript, sentence]);

  const toggle = useCallback(async () => {
    if (isProcessing) return;

    if (isListening) {
      stop();
      return;
    }

    setResult(null);
    const started = await start();
    if (!started) {
      toast.error(
        "Microphone access is blocked. Please allow it in your browser settings.",
        { duration: 4000 },
      );
    }
  }, [isProcessing, isListening, start, stop]);

  function clearResult() {
    setResult(null);
  }

  return {
    result,
    isListening,
    isProcessing,
    isSupported,
    error,
    toggle,
    clearResult,
  };
}
