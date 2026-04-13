"use client";

import { useCallback, useRef, useState } from "react";
import type { TSpeechMode } from "./types";

interface IUseAzureSpeechReturn {
  transcript: string;
  resultId: number;
  isListening: boolean;
  isProcessing: boolean;
  error: string | null;
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

// Cache the token for 9 minutes (TTL is 10 minutes)
let cachedToken: { token: string; region: string; expiresAt: number } | null =
  null;

async function fetchToken(): Promise<{
  token: string;
  region: string;
} | null> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return { token: cachedToken.token, region: cachedToken.region };
  }
  const res = await fetch("/api/speech/token", { method: "POST" });
  if (!res.ok) return null;
  const data = await res.json();
  cachedToken = { ...data, expiresAt: Date.now() + 9 * 60 * 1000 };
  return data;
}

function reportUsage(durationSeconds: number, mode: TSpeechMode) {
  fetch("/api/speech/usage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ durationSeconds, mode }),
  });
}

function floatTo16BitPCM(float32: Float32Array): ArrayBuffer {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16.buffer;
}

export function useAzureSpeech(
  lang: string,
  mode: TSpeechMode,
): IUseAzureSpeechReturn {
  const [transcript, setTranscript] = useState("");
  const [resultId, setResultId] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognizerRef = useRef<unknown>(null);
  const busyRef = useRef(false);
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gotResultRef = useRef(false);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const pushStreamRef = useRef<unknown>(null);
  const micStoppedRef = useRef(false);

  function cleanupMic() {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
  }

  const start = useCallback(async (): Promise<boolean> => {
    if (busyRef.current) return false;
    busyRef.current = true;

    const permission = await checkMicPermission();
    if (permission === "denied") {
      busyRef.current = false;
      return false;
    }

    setError(null);
    setTranscript("");
    setIsProcessing(false);
    gotResultRef.current = false;
    micStoppedRef.current = false;

    // Get mic immediately — this will prompt if permission is needed
    let micStream: MediaStream;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      busyRef.current = false;
      return false;
    }

    micStreamRef.current = micStream;

    // Start capturing audio at 16kHz for Azure
    const audioContext = new AudioContext({ sampleRate: 16000 });
    audioContextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(micStream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    // Buffer audio until the push stream is ready
    const buffer: ArrayBuffer[] = [];
    let pushStream: { write: (b: ArrayBuffer) => void; close: () => void } | null =
      null;

    processor.onaudioprocess = (e: AudioProcessingEvent) => {
      const pcm = floatTo16BitPCM(e.inputBuffer.getChannelData(0));
      if (pushStream) {
        pushStream.write(pcm);
      } else {
        buffer.push(pcm);
      }
    };

    source.connect(processor);
    processor.connect(audioContext.destination);

    // Listening starts immediately
    setIsListening(true);
    startTimeRef.current = Date.now();

    timeoutRef.current = setTimeout(() => {
      if (recognizerRef.current) {
        (
          recognizerRef.current as {
            stopContinuousRecognitionAsync: () => void;
          }
        ).stopContinuousRecognitionAsync();
      }
    }, 60000);

    // Connect to Azure in the background
    (async () => {
      try {
        const [tokenData, sdk] = await Promise.all([
          fetchToken(),
          import("microsoft-cognitiveservices-speech-sdk"),
        ]);

        if (!tokenData) {
          setError(
            "Speech service unavailable. You may have reached your monthly limit.",
          );
          cleanupMic();
          setIsListening(false);
          setIsProcessing(false);
          busyRef.current = false;
          return;
        }

        const stream = sdk.AudioInputStream.createPushStream(
          sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1),
        );
        pushStreamRef.current = stream;

        // Flush buffered audio
        for (const chunk of buffer) {
          stream.write(chunk);
        }
        buffer.length = 0;

        // Wire up for live audio
        pushStream = stream;

        // If user already stopped, close the stream so recognizer can finish
        if (micStoppedRef.current) {
          stream.close();
        }

        const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(
          tokenData.token,
          tokenData.region,
        );
        speechConfig.speechRecognitionLanguage = lang;

        const audioConfig = sdk.AudioConfig.fromStreamInput(stream);
        const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
        recognizerRef.current = recognizer;

        let text = "";

        recognizer.recognized = (
          _s: unknown,
          e: { result: { text: string; reason: number } },
        ) => {
          if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
            gotResultRef.current = true;
            text += (text ? " " : "") + e.result.text;
            setTranscript(text);
          }
        };

        recognizer.canceled = (
          _s: unknown,
          e: { reason: number; errorDetails: string },
        ) => {
          if (e.reason === sdk.CancellationReason.Error) {
            setError(e.errorDetails || "Speech recognition failed");
          }
        };

        recognizer.sessionStopped = () => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }

          const durationSeconds = (Date.now() - startTimeRef.current) / 1000;
          reportUsage(durationSeconds, mode);

          setIsListening(false);
          setIsProcessing(false);
          busyRef.current = false;
          recognizerRef.current = null;
          pushStreamRef.current = null;

          if (gotResultRef.current) {
            setResultId((id) => id + 1);
          }

          try {
            recognizer.close();
          } catch {
            // already closed
          }
        };

        recognizer.startContinuousRecognitionAsync(
          () => {
            // Connected — if user already stopped, trigger stop on the recognizer
            if (micStoppedRef.current) {
              recognizer.stopContinuousRecognitionAsync();
            }
          },
          (err: string) => {
            setError(err || "Failed to start recognition");
            cleanupMic();
            setIsListening(false);
            setIsProcessing(false);
            busyRef.current = false;
            recognizerRef.current = null;
            pushStreamRef.current = null;
          },
        );
      } catch {
        setError("Failed to initialize speech service");
        cleanupMic();
        setIsListening(false);
        setIsProcessing(false);
        busyRef.current = false;
      }
    })();

    return true;
  }, [lang, mode]);

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    micStoppedRef.current = true;
    cleanupMic();

    // Close push stream so Azure knows there's no more audio
    if (pushStreamRef.current) {
      (pushStreamRef.current as { close: () => void }).close();
    }

    if (recognizerRef.current) {
      setIsListening(false);
      setIsProcessing(true);
      (
        recognizerRef.current as {
          stopContinuousRecognitionAsync: () => void;
        }
      ).stopContinuousRecognitionAsync();
    } else {
      // Azure hasn't connected yet — show processing while we wait
      setIsListening(false);
      setIsProcessing(true);
    }
  }, []);

  return {
    transcript,
    resultId,
    isListening,
    isProcessing,
    error,
    start,
    stop,
  };
}
