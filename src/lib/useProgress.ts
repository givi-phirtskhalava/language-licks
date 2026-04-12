"use client";

import { useCallback, useSyncExternalStore } from "react";
import { ILessonProgress, TPhase } from "./types";
import { TLanguageId } from "./projectConfig";

function storageKey(language: TLanguageId): string {
  return `lesson-progress-${language}`;
}

function pauseKey(language: TLanguageId): string {
  return `reviews-paused-${language}`;
}

const IS_DEV = process.env.NODE_ENV === "development";
const INITIAL_INTERVAL_MS = IS_DEV ? 30000 : 24 * 60 * 60 * 1000;
const RETIRE_THRESHOLD_MS = IS_DEV ? 120000 : 180 * 24 * 60 * 60 * 1000;

export const MAX_MASTERY_LEVEL = 9;

export function getMasteryLevel(p: ILessonProgress | null): number {
  if (!p || !p.completed) return 0;
  if (p.retired) return MAX_MASTERY_LEVEL;
  return Math.min(
    Math.floor(Math.log2(p.interval / INITIAL_INTERVAL_MS)) + 1,
    MAX_MASTERY_LEVEL
  );
}

type TProgressMap = Record<number, ILessonProgress>;

// --- Module-level store ---

let listeners: (() => void)[] = [];
let dbMode = false;
const dbData = new Map<string, TProgressMap>();
const snapshotCache = new Map<
  string,
  { raw: string | null; data: TProgressMap }
>();
const SERVER_SNAPSHOT: TProgressMap = {};

function emitChange() {
  listeners.forEach((l) => l());
}

const EMPTY_PROGRESS: TProgressMap = {};

function getSnapshot(key: string): TProgressMap {
  if (dbMode) {
    return dbData.get(key) ?? EMPTY_PROGRESS;
  }
  const raw = localStorage.getItem(key);
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return cached.data;
  const data = raw ? (JSON.parse(raw) as TProgressMap) : {};
  snapshotCache.set(key, { raw, data });
  return data;
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function save(key: string, progress: TProgressMap) {
  if (dbMode) {
    dbData.set(key, progress);
    emitChange();
    return;
  }
  const json = JSON.stringify(progress);
  snapshotCache.set(key, { raw: json, data: progress });
  localStorage.setItem(key, json);
  emitChange();
}

function syncLessonToApi(lessonId: number, data: ILessonProgress) {
  fetch("/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lessonId, ...data }),
  }).catch((err) => console.error("Failed to sync progress:", err));
}

function defaultProgress(): ILessonProgress {
  return {
    phase: "lesson",
    completed: false,
    completedAt: null,
    interval: INITIAL_INTERVAL_MS,
    nextReview: null,
    retired: false,
    writingBestTime: null,
    speakingBestTime: null,
    writingStreak: 0,
    speakingStreak: 0,
  };
}

// --- Pause store (localStorage for both modes) ---

const pauseCache = new Map<
  string,
  { raw: string | null; value: number | null }
>();

function getPauseSnapshot(language: TLanguageId): number | null {
  const pk = pauseKey(language);
  const raw = localStorage.getItem(pk);
  const cached = pauseCache.get(pk);
  if (cached && cached.raw === raw) return cached.value;
  const value = raw ? Number(raw) : null;
  pauseCache.set(pk, { raw, value });
  return value;
}

// --- Public API for sync ---

export async function hydrateFromApi(language: TLanguageId) {
  const res = await fetch(`/api/progress?language=${language}`);
  if (!res.ok) return;
  const { progress } = await res.json();
  dbMode = true;
  dbData.set(storageKey(language), progress as TProgressMap);
  emitChange();
}

export async function syncAndClear(language: TLanguageId) {
  const key = storageKey(language);
  const raw = localStorage.getItem(key);
  const localProgress: TProgressMap = raw ? JSON.parse(raw) : {};

  if (Object.keys(localProgress).length > 0) {
    await fetch("/api/progress/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, progress: localProgress }),
    });
  }

  const res = await fetch(`/api/progress?language=${language}`);
  if (res.ok) {
    const { progress } = await res.json();
    dbData.set(key, progress as TProgressMap);
  } else {
    dbData.set(key, localProgress);
  }

  dbMode = true;
  localStorage.removeItem(key);
  emitChange();
}

export function clearDbMode() {
  dbMode = false;
  dbData.clear();
  emitChange();
}

export async function clearAllProgress(language: TLanguageId) {
  const res = await fetch("/api/progress/clear", { method: "POST" });
  if (!res.ok) throw new Error("Failed to clear progress");
  dbData.set(storageKey(language), {});
  emitChange();
}

// --- Hook ---

export default function useProgress(language: TLanguageId) {
  const key = storageKey(language);
  const getSnap = useCallback(() => getSnapshot(key), [key]);
  const getPause = useCallback(() => getPauseSnapshot(language), [language]);
  const progress = useSyncExternalStore(subscribe, getSnap, () => SERVER_SNAPSHOT);
  const pausedAt = useSyncExternalStore(subscribe, getPause, () => null
  );

  const updatePhase = useCallback(
    (lessonId: number, phase: TPhase, isReview = false) => {
      const current = getSnapshot(key);
      const existing = current[lessonId] ?? defaultProgress();
      const now = Date.now();

      let updated: ILessonProgress;

      if (phase === "complete") {
        if (!isReview && existing.completed) {
          updated = { ...existing, phase };
        } else {
          const nextInterval = isReview
            ? existing.interval * 2
            : INITIAL_INTERVAL_MS;
          const retired = nextInterval >= RETIRE_THRESHOLD_MS;

          updated = {
            ...existing,
            phase,
            completed: true,
            completedAt: now,
            interval: nextInterval,
            nextReview: retired ? null : now + nextInterval,
            retired,
          };
        }
      } else {
        updated = { ...existing, phase };
      }

      save(key, { ...current, [lessonId]: updated });
      if (dbMode) syncLessonToApi(lessonId, updated);
    },
    [key]
  );

  const updateStreak = useCallback(
    (lessonId: number, type: "writing" | "speaking", streak: number) => {
      const current = getSnapshot(key);
      const existing = current[lessonId] ?? defaultProgress();
      const field = type === "writing" ? "writingStreak" : "speakingStreak";
      const updated = { ...existing, [field]: streak };
      save(key, { ...current, [lessonId]: updated });
      if (dbMode) syncLessonToApi(lessonId, updated);
    },
    [key]
  );

  const updateBestTime = useCallback(
    (lessonId: number, type: "writing" | "speaking", time: number) => {
      const current = getSnapshot(key);
      const existing = current[lessonId] ?? defaultProgress();
      const field =
        type === "writing" ? "writingBestTime" : "speakingBestTime";
      const current_best = existing[field];
      const newBest =
        current_best === null ? time : Math.min(current_best, time);
      const updated = { ...existing, [field]: newBest };
      save(key, { ...current, [lessonId]: updated });
      if (dbMode) syncLessonToApi(lessonId, updated);
    },
    [key]
  );

  const getLesson = useCallback(
    (lessonId: number): ILessonProgress | null => {
      return progress[lessonId] ?? null;
    },
    [progress]
  );

  const unretire = useCallback(
    (lessonId: number) => {
      const current = getSnapshot(key);
      const existing = current[lessonId];
      if (!existing) return;

      const updated: ILessonProgress = {
        ...existing,
        retired: false,
        interval: INITIAL_INTERVAL_MS,
        nextReview: Date.now() + INITIAL_INTERVAL_MS,
      };
      save(key, { ...current, [lessonId]: updated });
      if (dbMode) syncLessonToApi(lessonId, updated);
    },
    [key]
  );

  const resetLesson = useCallback(
    (lessonId: number) => {
      const current = getSnapshot(key);
      const { [lessonId]: _, ...rest } = current;
      save(key, rest);
      if (dbMode) {
        syncLessonToApi(lessonId, defaultProgress());
      }
    },
    [key]
  );

  const pauseReviews = useCallback(() => {
    localStorage.setItem(pauseKey(language), String(Date.now()));
    emitChange();
  }, [language]);

  const unpauseReviews = useCallback(() => {
    const raw = localStorage.getItem(pauseKey(language));
    if (!raw) return;
    const pausedTimestamp = Number(raw);
    const duration = Date.now() - pausedTimestamp;
    const current = getSnapshot(key);
    const updated = { ...current };
    for (const idx of Object.keys(updated)) {
      const lesson = updated[Number(idx)];
      if (lesson.nextReview && !lesson.retired) {
        updated[Number(idx)] = {
          ...lesson,
          nextReview: lesson.nextReview + duration,
        };
      }
    }
    save(key, updated);
    localStorage.removeItem(pauseKey(language));
    emitChange();

    if (dbMode) {
      for (const idx of Object.keys(updated)) {
        syncLessonToApi(Number(idx), updated[Number(idx)]);
      }
    }
  }, [key, language]);

  return {
    progress,
    updatePhase,
    updateStreak,
    updateBestTime,
    getLesson,
    unretire,
    resetLesson,
    pausedAt,
    pauseReviews,
    unpauseReviews,
  };
}
