"use client";

import { useCallback, useRef, useState } from "react";

export interface ISpeechWordScore {
  word: string;
  expectedIpa?: string;
  heardIpa?: string;
  gopScore: number;
}

export interface ISpeechExtraSegment {
  afterWordIndex: number;
  afterWord: string | null;
  heardIpa: string;
}

export interface ISpeechScoreResult {
  target?: string;
  expectedIpa?: string;
  heardIpa?: string;
  perWord?: ISpeechWordScore[];
  extraSegments?: ISpeechExtraSegment[];
  language?: string;
  durationMs?: number;
  inferenceMs?: number;
}

export const GOP_PASS_THRESHOLD = 0.25;
export const MAX_EXTRA_SEGMENTS = 1;

export function didPass(score: ISpeechScoreResult): boolean {
  if (!score.perWord) return false;
  const allWordsOk = score.perWord.every(
    (w) => w.gopScore >= GOP_PASS_THRESHOLD
  );
  const extrasOk = (score.extraSegments ?? []).length <= MAX_EXTRA_SEGMENTS;
  return allWordsOk && extrasOk;
}

interface IUseSpeechCheckReturn {
  scoreResult: ISpeechScoreResult | null;
  resultId: number;
  isListening: boolean;
  isProcessing: boolean;
  error: string | null;
  start: (target?: string) => Promise<boolean>;
  stop: () => void;
}

const SILENCE_THRESHOLD = 0.01;
const SILENCE_DURATION = 1500;
const MAX_RECORDING_MS = 15000;
const SAMPLE_RATE = 16000;
const RETRY_ATTEMPTS = 3;
const RETRY_BASE_MS = 400;

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

function encodeWav(pcm: Float32Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcm.length * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

async function postSpeechCheck(
  blob: Blob,
  lang: string,
  lessonId: number,
  target?: string
): Promise<ISpeechScoreResult> {
  let lastError: unknown = null;

  const params = new URLSearchParams({ lang, lessonId: String(lessonId) });
  if (target) params.set("target", target);

  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
    try {
      const form = new FormData();
      form.append("audio", blob, "audio.wav");

      const res = await fetch(`/api/speech/check?${params.toString()}`, {
        method: "POST",
        body: form,
      });

      if (res.status === 429) throw new Error("rate_limited");
      if (!res.ok) throw new Error(`speech_check_${res.status}`);

      return (await res.json()) as ISpeechScoreResult;
    } catch (err) {
      lastError = err;
      if (attempt < RETRY_ATTEMPTS - 1) {
        const delay = RETRY_BASE_MS * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError ?? new Error("speech_check_failed");
}

export function useSpeechCheck(
  lang: string,
  lessonId: number
): IUseSpeechCheckReturn {
  const [scoreResult, setScoreResult] = useState<ISpeechScoreResult | null>(
    null
  );
  const [resultId, setResultId] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);
  const targetRef = useRef<string | undefined>(undefined);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const speechDetectedRef = useRef(false);
  const rafRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  function cleanup() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
  }

  async function sendAudio(blob: Blob) {
    setIsListening(false);
    setIsProcessing(true);

    try {
      console.log(
        `[speech-check] sending audio — ${(blob.size / 1024).toFixed(1)} KB`
      );
      const result = await postSpeechCheck(
        blob,
        lang,
        lessonId,
        targetRef.current
      );
      console.log("[speech-check] response:", result);

      if (result.perWord) {
        setScoreResult(result);
        setResultId((id) => id + 1);
      }
    } catch (err) {
      console.log("[speech-check] error:", err);
      setError("Speech recognition failed");
    }

    setIsProcessing(false);
    busyRef.current = false;
  }

  function finishRecording() {
    cleanup();

    const maxSamples = SAMPLE_RATE * (MAX_RECORDING_MS / 1000);
    let totalLength = 0;
    for (const chunk of pcmChunksRef.current) totalLength += chunk.length;
    const cappedLength = Math.min(totalLength, maxSamples);
    const pcm = new Float32Array(cappedLength);
    let offset = 0;
    for (const chunk of pcmChunksRef.current) {
      const remaining = cappedLength - offset;
      if (remaining <= 0) break;
      const toCopy = Math.min(chunk.length, remaining);
      pcm.set(chunk.subarray(0, toCopy), offset);
      offset += toCopy;
    }

    if (pcm.length > 0 && speechDetectedRef.current) {
      const wav = encodeWav(pcm, SAMPLE_RATE);
      sendAudio(wav);
    } else {
      setIsListening(false);
      busyRef.current = false;
    }
  }

  function stopRecording() {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    finishRecording();
  }

  function monitorSilence() {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const dataArray = new Float32Array(analyser.fftSize);

    function check() {
      if (stoppedRef.current) return;

      analyser!.getFloatTimeDomainData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);

      if (rms > SILENCE_THRESHOLD) {
        speechDetectedRef.current = true;
        silenceStartRef.current = null;
      } else if (speechDetectedRef.current) {
        if (silenceStartRef.current === null) {
          silenceStartRef.current = Date.now();
        } else if (Date.now() - silenceStartRef.current >= SILENCE_DURATION) {
          stopRecording();
          return;
        }
      }

      rafRef.current = requestAnimationFrame(check);
    }

    rafRef.current = requestAnimationFrame(check);
  }

  const start = useCallback(
    async (target?: string): Promise<boolean> => {
      if (busyRef.current) return false;
      busyRef.current = true;
      targetRef.current = target;

      const permission = await checkMicPermission();
      if (permission === "denied") {
        busyRef.current = false;
        return false;
      }

      setError(null);
      setScoreResult(null);
      setIsProcessing(false);
      speechDetectedRef.current = false;
      silenceStartRef.current = null;
      stoppedRef.current = false;
      pcmChunksRef.current = [];

      let micStream: MediaStream;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        busyRef.current = false;
        return false;
      }

      micStreamRef.current = micStream;

      const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(micStream);

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e: AudioProcessingEvent) => {
        if (!stoppedRef.current) {
          pcmChunksRef.current.push(
            new Float32Array(e.inputBuffer.getChannelData(0))
          );
        }
      };
      source.connect(processor);
      processor.connect(audioContext.destination);
      processorRef.current = processor;

      setIsListening(true);

      monitorSilence();

      timeoutRef.current = setTimeout(() => {
        stopRecording();
      }, MAX_RECORDING_MS);

      return true;
    },
    [lang]
  );

  const stop = useCallback(() => {
    stopRecording();
  }, []);

  return {
    scoreResult,
    resultId,
    isListening,
    isProcessing,
    error,
    start,
    stop,
  };
}
