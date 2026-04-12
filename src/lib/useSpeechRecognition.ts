"use client";

import { useCallback, useRef, useState } from "react";

interface SpeechRecognitionResult {
  transcript: string;
  resultId: number;
  isListening: boolean;
  isProcessing: boolean;
  error: string | null;
  isSupported: boolean;
  start: () => Promise<boolean>;
  stop: () => void;
}

async function checkMicPermission(): Promise<"granted" | "denied" | "prompt"> {
  if (navigator.permissions) {
    try {
      const status = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });
      return status.state as "granted" | "denied" | "prompt";
    } catch {
      // Firefox doesn't support microphone permission query
    }
  }
  return "prompt";
}

async function requestMicAccess(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    return false;
  }
}

export function useSpeechRecognition(lang: string): SpeechRecognitionResult {
  const [transcript, setTranscript] = useState("");
  const [resultId, setResultId] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const start = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Speech recognition is not supported in this browser.");
      return false;
    }

    const permission = await checkMicPermission();
    if (permission === "denied") {
      return false;
    }
    if (permission === "prompt") {
      const granted = await requestMicAccess();
      if (!granted) {
        return false;
      }
    }

    setError(null);
    setTranscript("");
    setIsProcessing(false);

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setResultId((id) => id + 1);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech") {
        setError("No speech detected. Please try again.");
      } else if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone access.");
      } else {
        setError(`Error: ${event.error}`);
      }
      setIsListening(false);
      setIsProcessing(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsProcessing(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    return true;
  }, [isSupported, lang]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsProcessing(true);
    }
  }, []);

  return { transcript, resultId, isListening, isProcessing, error, isSupported, start, stop };
}
