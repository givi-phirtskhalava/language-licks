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
  const busyRef = useRef(false);
  const gotResultRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const start = useCallback(async (): Promise<boolean> => {
    if (!isSupported || busyRef.current) return false;
    busyRef.current = true;

    // Abort any lingering instance
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* already dead */ }
      recognitionRef.current = null;
    }

    const permission = await checkMicPermission();
    if (permission === "denied") {
      busyRef.current = false;
      return false;
    }
    if (permission === "prompt") {
      const granted = await requestMicAccess();
      if (!granted) {
        busyRef.current = false;
        return false;
      }
    }

    setError(null);
    setTranscript("");
    setIsProcessing(false);
    gotResultRef.current = false;

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      gotResultRef.current = true;
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted") return;
      if (event.error === "no-speech") {
        setError("No speech detected. Please try again.");
      } else if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone access.");
      } else {
        setError(`Error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      recognitionRef.current = null;
      busyRef.current = false;
      setIsListening(false);
      setIsProcessing(false);
      if (gotResultRef.current) {
        setResultId((id) => id + 1);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      busyRef.current = false;
      recognitionRef.current = null;
      return false;
    }

    timeoutRef.current = setTimeout(() => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }, 60000);

    setIsListening(true);
    return true;
  }, [isSupported, lang]);

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (recognitionRef.current) {
      setIsListening(false);
      setIsProcessing(true);
      recognitionRef.current.stop();
    }
  }, []);

  return { transcript, resultId, isListening, isProcessing, error, isSupported, start, stop };
}
