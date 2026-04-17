"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useWhisperSpeech } from "@/lib/useWhisperSpeech";
import {
  compareWriting,
  IWriteWordResult,
  TWriteWordStatus,
} from "@/components/organisms/LanguageCard/hooks/useWritingCheck";
// Strip leading hesitations/restarts from speech.
// If the user stutters "Nos... nos amis les animaux..." we find the
// latest point where the correct sequence begins and trim before it.
// Speech recognition can't distinguish French silent endings (e.g. plural "s")
function isSpeechEquivalent(expected: string, actual: string): boolean {
  const exp = expected
    .replace(/[^a-zA-ZàâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ']/g, "")
    .toLowerCase();
  const act = actual
    .replace(/[^a-zA-ZàâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ']/g, "")
    .toLowerCase();
  if (exp === act) return true;
  if (exp + "s" === act || act + "s" === exp) return true;
  return false;
}

// Strip leading hesitations/restarts from speech.
// If the user stutters "Nos... nos amis les animaux..." we find the
// latest point where the correct sequence begins and trim before it.
function stripHesitation(expected: string, actual: string): string {
  const expWords = expected.replace(/[.,!?;:…]+$/, "").split(/\s+/).filter(Boolean);
  const actWords = actual.replace(/[.,!?;:…]+$/, "").split(/\s+/).filter(Boolean);

  if (expWords.length === 0 || actWords.length === 0) return actual;

  const firstExpected = expWords[0].toLowerCase().replace(/[^a-zA-ZàâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ']/g, "");

  // Find the latest index where the first expected word appears
  let bestStart = 0;
  for (let i = actWords.length - expWords.length; i >= 0; i--) {
    const actWord = actWords[i].toLowerCase().replace(/[^a-zA-ZàâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ']/g, "");
    if (actWord === firstExpected) {
      bestStart = i;
      break;
    }
  }

  if (bestStart === 0) return actual;
  return actWords.slice(bestStart).join(" ");
}

interface ISpeakResult {
  correct: boolean;
  words: IWriteWordResult[];
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
    transcript,
    resultId,
    isListening,
    isProcessing,
    error,
    start,
    stop,
  } = useWhisperSpeech(lang.slice(0, 2));

  const [result, setResult] = useState<ISpeakResult | null>(null);
  const processedResultId = useRef(0);

  useEffect(() => {
    if (resultId > processedResultId.current && transcript) {
      processedResultId.current = resultId;
      console.log("[speech] transcript:", transcript);

      const cleaned = stripHesitation(sentence, transcript);
      console.log("[speech] cleaned:", cleaned);
      const results = compareWriting(sentence, cleaned);
      const passed = !results.some(
        (r) =>
          (r.status === "error" &&
            !(r.actual && isSpeechEquivalent(r.expected, r.actual))) ||
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
    if (!started && !error) {
      toast.error(
        "Microphone access is blocked. Please allow it in your browser settings.",
        { duration: 4000 },
      );
    }
  }, [isProcessing, isListening, start, stop, error]);

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
