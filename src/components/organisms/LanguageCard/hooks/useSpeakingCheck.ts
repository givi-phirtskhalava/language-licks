"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import {
  compareWriting,
  IWriteWordResult,
} from "@/components/organisms/LanguageCard/hooks/useWritingCheck";

interface ISpeakResult {
  correct: boolean;
  words: IWriteWordResult[];
}

interface IUseSpeakingCheckReturn {
  result: ISpeakResult | null;
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
): IUseSpeakingCheckReturn {
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

  const [result, setResult] = useState<ISpeakResult | null>(null);
  const processedResultId = useRef(0);

  useEffect(() => {
    if (resultId > processedResultId.current && transcript) {
      processedResultId.current = resultId;
      const results = compareWriting(sentence, transcript);
      const passed = !results.some(
        (r) =>
          r.status === "error" ||
          r.status === "missing" ||
          r.status === "extra",
      );
      setResult({ correct: passed, words: results });
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
