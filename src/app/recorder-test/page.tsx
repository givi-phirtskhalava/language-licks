"use client";

import { useRef, useState } from "react";
import Button from "@atoms/Button";
import style from "./RecorderTest.module.css";
import pageStyle from "../page.module.css";

const SAMPLE_RATE = 16000;
const MAX_MS = 30000;

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

export default function RecorderTestPage() {
  const [lang, setLang] = useState("fr");
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("Ready.");
  const [last, setLast] = useState<ILastRecording | null>(null);

  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    const seconds = pcm.length / SAMPLE_RATE;
    const sizeKb = blob.size / 1024;

    setLast({ url, filename, seconds, sizeKb });
    setStatus(`Saved ${filename}`);
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

  return (
    <main className={pageStyle.main}>
      <div className={style.container}>
        <div className={style.content}>
          <h1 className={style.title}>Recorder Test</h1>
          <p className={style.description}>
            Records 16 kHz mono WAV clips and downloads with sequential names.
            Same audio pipeline as the main app.
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
              Stop & Download
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

              <a
                href={last.url}
                download={last.filename}
                className={style.downloadLink}
              >
                Download again
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
