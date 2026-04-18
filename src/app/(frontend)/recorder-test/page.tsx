"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@atoms/Button";
import CorrectionDisplay from "@atoms/CorrectionDisplay";
import {
  IWhisperScoreResult,
  IWhisperWordScore,
} from "@lib/useWhisperSpeech";
import { IWriteWordResult } from "@organisms/LanguageCard/hooks/useWritingCheck";
import { getLessons } from "@lib/lessons";
import { LANGUAGES as PROJECT_LANGUAGES, TLanguageId } from "@lib/projectConfig";
import style from "./RecorderTest.module.css";
import pageStyle from "../page.module.css";

const SAMPLE_RATE = 16000;
const MAX_MS = 30000;
const SAMPLE_AUDIO_PATH = "/temp/sample_fr_26.wav";

function languageIdForCode(code: string): TLanguageId | null {
  const match = PROJECT_LANGUAGES.find((l) =>
    l.locale.toLowerCase().startsWith(code.toLowerCase()),
  );
  return match ? (match.id as TLanguageId) : null;
}

interface ILanguageOption {
  code: string;
  name: string;
}

const LANGUAGES: ILanguageOption[] = [
  { code: "en", name: "English" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "es", name: "Spanish" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
  { code: "ru", name: "Russian" },
  { code: "tr", name: "Turkish" },
];

interface ILastRecording {
  url: string;
  filename: string;
  seconds: number;
  sizeKb: number;
  blob: Blob;
}

interface ITokenInfo {
  token: string;
  expiresAtMs: number;
}

interface IWhisperResult {
  transcript: string;
  language?: string;
  durationMs?: number;
  inferenceMs?: number;
  status: number;
  raw: string;
  overallScore?: number;
  perWord?: IWhisperWordScore[];
  heardIpa?: string;
}

function wordsFromScore(score: IWhisperScoreResult): IWriteWordResult[] {
  if (!score.perWord) return [];
  return score.perWord.map((w) => {
    if (!w.flagged) {
      return { expected: w.word, actual: w.word, status: "correct" };
    }
    if (
      w.flagReason === "mispronunciation" ||
      w.flagReason === "insertion" ||
      w.flagReason === "deletion"
    ) {
      return { expected: w.word, actual: w.word, status: "warning" };
    }
    return {
      expected: w.word,
      actual: w.whisperHeard ?? null,
      status: w.whisperHeard ? "error" : "missing",
    };
  });
}

function counterKey(lang: string): string {
  return `recorder.count.${lang}`;
}

function currentCount(lang: string): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(counterKey(lang)) || "0", 10);
}

function nextIndex(lang: string): number {
  const next = currentCount(lang) + 1;
  localStorage.setItem(counterKey(lang), String(next));
  return next;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
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

function formatExpiry(expiresAtMs: number): string {
  const remaining = Math.max(0, expiresAtMs - Date.now());
  const totalSec = Math.floor(remaining / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}m ${pad(s)}s`;
}

export default function RecorderTestPage() {
  const [lang, setLang] = useState("fr");
  const [target, setTarget] = useState("");
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("Ready.");
  const [last, setLast] = useState<ILastRecording | null>(null);
  const [token, setToken] = useState<ITokenInfo | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [whisperResult, setWhisperResult] = useState<IWhisperResult | null>(null);
  const [whisperError, setWhisperError] = useState<string | null>(null);
  const [whisperLoading, setWhisperLoading] = useState(false);
  const [correction, setCorrection] = useState<IWriteWordResult[] | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);

  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const gatewayUrl = process.env.NEXT_PUBLIC_WHISPER_GATEWAY_URL;

  const languageId = languageIdForCode(lang);
  const lessons = languageId ? getLessons(languageId) : [];

  useEffect(() => {
    let cancelled = false;
    async function loadSample() {
      try {
        const res = await fetch(SAMPLE_AUDIO_PATH);
        if (!res.ok) return;
        const blob = await res.blob();
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        const seconds = Math.max(0, (blob.size - 44) / 2 / SAMPLE_RATE);
        setLast({
          url,
          filename: "sample_fr_26.wav",
          seconds,
          sizeKb: blob.size / 1024,
          blob,
        });
        setStatus("Loaded sample_fr_26.wav");
      } catch {
        // ignore — sample is optional
      }
    }
    loadSample();
    return () => {
      cancelled = true;
    };
  }, []);

  function cleanup() {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(function (t) {
        t.stop();
      });
      micStreamRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  async function start() {
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      micStreamRef.current = micStream;

      const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(micStream);

      pcmChunksRef.current = [];
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = function (e: AudioProcessingEvent) {
        pcmChunksRef.current.push(
          new Float32Array(e.inputBuffer.getChannelData(0))
        );
      };
      source.connect(processor);
      processor.connect(audioContext.destination);
      processorRef.current = processor;

      setRecording(true);
      setStatus("Recording... (max 30s)");

      timeoutRef.current = setTimeout(stop, MAX_MS);
    } catch {
      setStatus("Microphone access denied.");
    }
  }

  function stop() {
    let total = 0;
    for (const chunk of pcmChunksRef.current) {
      total += chunk.length;
    }
    const pcm = new Float32Array(total);
    let offset = 0;
    for (const chunk of pcmChunksRef.current) {
      pcm.set(chunk, offset);
      offset += chunk.length;
    }

    const idx = nextIndex(lang);
    const filename = `sample_${lang}_${pad(idx)}.wav`;
    const blob = encodeWav(pcm, SAMPLE_RATE);
    const url = URL.createObjectURL(blob);

    if (last) {
      URL.revokeObjectURL(last.url);
    }

    const seconds = pcm.length / SAMPLE_RATE;
    const sizeKb = blob.size / 1024;

    setLast({ url, filename, seconds, sizeKb, blob });
    setStatus(`Recorded ${filename}`);
    setWhisperResult(null);
    setWhisperError(null);
    setRecording(false);
    cleanup();
  }

  function toggle() {
    if (recording) {
      stop();
    } else {
      start();
    }
  }

  function downloadLast() {
    if (!last) return;
    const anchor = document.createElement("a");
    anchor.href = last.url;
    anchor.download = last.filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  async function fetchToken() {
    setTokenError(null);
    setTokenLoading(true);
    try {
      const res = await fetch("/api/speech/token", { method: "POST" });
      const bodyText = await res.text();
      if (!res.ok) {
        setTokenError(`HTTP ${res.status}: ${bodyText}`);
        setToken(null);
        return;
      }
      const data = JSON.parse(bodyText) as {
        token: string;
        expiresInSec: number;
      };
      setToken({
        token: data.token,
        expiresAtMs: Date.now() + data.expiresInSec * 1000,
      });
    } catch (err) {
      setTokenError((err as Error).message);
      setToken(null);
    }
    setTokenLoading(false);
  }

  async function sendToWhisper() {
    if (!last || !token) return;
    if (!gatewayUrl) {
      setWhisperError("NEXT_PUBLIC_WHISPER_GATEWAY_URL not configured");
      return;
    }

    setWhisperError(null);
    setWhisperResult(null);
    setCorrection(null);
    setPassed(null);
    setWhisperLoading(true);

    try {
      const form = new FormData();
      form.append("audio", last.blob, last.filename);

      const params = new URLSearchParams({ lang });
      const trimmedTarget = target.trim();
      if (trimmedTarget) params.set("target", trimmedTarget);

      const res = await fetch(`${gatewayUrl}/transcribe?${params.toString()}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token.token}` },
        body: form,
      });

      const bodyText = await res.text();

      if (!res.ok) {
        setWhisperError(`HTTP ${res.status}: ${bodyText}`);
        setWhisperLoading(false);
        return;
      }

      const data = JSON.parse(bodyText) as IWhisperScoreResult & {
        language?: string;
        durationMs?: number;
        inferenceMs?: number;
      };

      setWhisperResult({
        transcript: data.transcript,
        language: data.language,
        durationMs: data.durationMs,
        inferenceMs: data.inferenceMs,
        status: res.status,
        raw: bodyText,
        overallScore: data.overallScore,
        perWord: data.perWord,
        heardIpa: data.heardIpa,
      });

      console.log("[speech] transcript:", data.transcript);
      if (data.perWord) {
        console.log(`[speech] overall score=${data.overallScore}`);
        console.table(
          data.perWord.map((w) => ({
            word: w.word,
            flagged: w.flagged,
            reason: w.flagReason ?? "",
            score: w.score,
            inserts: w.insertions ?? 0,
            drops: w.deletions ?? 0,
            added: w.added ?? "",
            dropped: w.dropped ?? "",
            expectedIpa: w.expectedIpa ?? "",
            heardIpa: w.heardIpa ?? "",
            whisper: w.whisperHeard ?? "<missing>",
          })),
        );
        const words = wordsFromScore(data);
        const didPass = data.perWord.every((w) => !w.flagged);
        setCorrection(words);
        setPassed(didPass);
      }
    } catch (err) {
      setWhisperError((err as Error).message);
    }
    setWhisperLoading(false);
  }

  return (
    <main className={pageStyle.main}>
      <div className={style.container}>
        <div className={style.content}>
          <h1 className={style.title}>Recorder Test</h1>

          <p className={style.description}>
            Records 16 kHz mono WAV clips. Use the Whisper section below to
            send the last recording to the self-hosted inference service.
          </p>

          <label htmlFor="lang" className={style.label}>
            Language
          </label>

          <select
            id="lang"
            className={style.select}
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            disabled={recording}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name} ({l.code})
              </option>
            ))}
          </select>

          {!recording && <Button onClick={toggle}>Start Recording</Button>}

          {recording && (
            <Button theme="danger" onClick={toggle}>
              Stop
            </Button>
          )}

          <p className={style.status}>{status}</p>

          {last && (
            <div className={style.preview}>
              <p className={style.previewName}>{last.filename}</p>

              <p className={style.previewMeta}>
                {last.seconds.toFixed(2)}s · {last.sizeKb.toFixed(1)} KB
              </p>

              <audio controls src={last.url} className={style.audio} />

              <button
                type="button"
                onClick={downloadLast}
                className={style.downloadLink}
              >
                Download
              </button>
            </div>
          )}

          <section className={style.section}>
            <h2 className={style.sectionTitle}>Whisper</h2>

            <p className={style.sectionMeta}>
              Gateway: <code>{gatewayUrl || "(not configured)"}</code>
            </p>

            <div className={style.row}>
              <Button theme="secondary" onClick={fetchToken}>
                {tokenLoading ? "Requesting..." : "Get Token"}
              </Button>

              {token && (
                <span className={style.tokenMeta}>
                  expires in {formatExpiry(token.expiresAtMs)}
                </span>
              )}
            </div>

            {tokenError && <p className={style.error}>{tokenError}</p>}

            {token && (
              <pre className={style.tokenPreview}>
                {token.token.slice(0, 32)}…{token.token.slice(-8)}
              </pre>
            )}

            <label htmlFor="target" className={style.label}>
              Target (optional) — enables pronunciation scoring
            </label>

            {lessons.length > 0 && (
              <select
                className={style.select}
                value={
                  lessons.findIndex((l) => l.sentence === target) === -1
                    ? ""
                    : String(lessons.findIndex((l) => l.sentence === target))
                }
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") return;
                  const idx = parseInt(v, 10);
                  if (!Number.isNaN(idx) && lessons[idx]) {
                    setTarget(lessons[idx].sentence);
                  }
                }}
              >
                <option value="">— pick a lesson —</option>
                {lessons.map((l, i) => (
                  <option key={i} value={i}>
                    {l.sentence}
                  </option>
                ))}
              </select>
            )}

            <textarea
              id="target"
              className={style.textarea}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. Nos amis les animaux ne sont pas admis dans ce magasin."
              rows={2}
            />

            <Button
              onClick={sendToWhisper}
              disabled={!last || !token || whisperLoading}
            >
              {whisperLoading ? "Transcribing..." : "Send to Whisper"}
            </Button>

            {whisperError && <p className={style.error}>{whisperError}</p>}

            {whisperResult && (
              <div className={style.result}>
                <p className={style.resultLabel}>Transcript</p>

                <p className={style.transcript}>
                  {whisperResult.transcript || "(empty)"}
                </p>

                <p className={style.resultMeta}>
                  {whisperResult.language && (
                    <span>lang: {whisperResult.language} · </span>
                  )}
                  {typeof whisperResult.durationMs === "number" && (
                    <span>audio: {whisperResult.durationMs}ms · </span>
                  )}
                  {typeof whisperResult.inferenceMs === "number" && (
                    <span>inference: {whisperResult.inferenceMs}ms</span>
                  )}
                  {typeof whisperResult.overallScore === "number" && (
                    <span> · overall: {whisperResult.overallScore}</span>
                  )}
                </p>

                {passed !== null && (
                  <p
                    className={
                      passed ? style.passBadge : style.failBadge
                    }
                  >
                    {passed ? "PASS" : "FAIL"}
                  </p>
                )}

                {correction && (
                  <CorrectionDisplay words={correction} />
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
