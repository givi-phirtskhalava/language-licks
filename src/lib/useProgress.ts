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

let listeners: (() => void)[] = [];
const snapshotCache = new Map<
  string,
  { raw: string | null; data: TProgressMap }
>();
const SERVER_SNAPSHOT: TProgressMap = {};

function emitChange() {
  listeners.forEach((l) => l());
}

function getSnapshot(key: string): TProgressMap {
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
  const json = JSON.stringify(progress);
  snapshotCache.set(key, { raw: json, data: progress });
  localStorage.setItem(key, json);
  emitChange();
}

function defaultProgress(): ILessonProgress {
  return {
    phase: "lesson",
    completed: false,
    completedAt: null,
    interval: INITIAL_INTERVAL_MS,
    nextReview: null,
    retired: false,
  };
}

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

export default function useProgress(language: TLanguageId) {
  const key = storageKey(language);
  const progress = useSyncExternalStore(
    subscribe,
    () => getSnapshot(key),
    () => SERVER_SNAPSHOT
  );
  const pausedAt = useSyncExternalStore(
    subscribe,
    () => getPauseSnapshot(language),
    () => null
  );

  const updatePhase = useCallback(
    (lessonIndex: number, phase: TPhase, isReview = false) => {
      const current = getSnapshot(key);
      const existing = current[lessonIndex] ?? defaultProgress();
      const now = Date.now();

      if (phase === "complete") {
        // Lesson test on an already-completed lesson — don't touch the review schedule
        if (!isReview && existing.completed) {
          save(key, {
            ...current,
            [lessonIndex]: { ...existing, phase },
          });
          return;
        }

        const nextInterval = isReview
          ? existing.interval * 2
          : INITIAL_INTERVAL_MS;
        const retired = nextInterval >= RETIRE_THRESHOLD_MS;

        save(key, {
          ...current,
          [lessonIndex]: {
            phase,
            completed: true,
            completedAt: now,
            interval: nextInterval,
            nextReview: retired ? null : now + nextInterval,
            retired,
          },
        });
      } else {
        save(key, {
          ...current,
          [lessonIndex]: {
            ...existing,
            phase,
          },
        });
      }
    },
    [key]
  );

  const getLesson = useCallback(
    (lessonIndex: number): ILessonProgress | null => {
      return progress[lessonIndex] ?? null;
    },
    [progress]
  );

  const unretire = useCallback(
    (lessonIndex: number) => {
      const current = getSnapshot(key);
      const existing = current[lessonIndex];
      if (!existing) return;

      save(key, {
        ...current,
        [lessonIndex]: {
          ...existing,
          retired: false,
          interval: INITIAL_INTERVAL_MS,
          nextReview: Date.now() + INITIAL_INTERVAL_MS,
        },
      });
    },
    [key]
  );

  const resetLesson = useCallback(
    (lessonIndex: number) => {
      const current = getSnapshot(key);
      const { [lessonIndex]: _, ...rest } = current;
      save(key, rest);
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
  }, [key, language]);

  return {
    progress,
    updatePhase,
    getLesson,
    unretire,
    resetLesson,
    pausedAt,
    pauseReviews,
    unpauseReviews,
  };
}
