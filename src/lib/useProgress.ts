"use client";

import { useCallback, useSyncExternalStore } from "react";
import { ILessonProgress, TPhase } from "./types";

const STORAGE_KEY = "lesson-progress";
const INITIAL_INTERVAL_MS = 24 * 60 * 60 * 1000; // 1 day
const RETIRE_THRESHOLD_MS = 180 * 24 * 60 * 60 * 1000; // ~6 months

type TProgressMap = Record<number, ILessonProgress>;

let listeners: (() => void)[] = [];
let cachedRaw: string | null = null;
let cachedSnapshot: TProgressMap = {};
const SERVER_SNAPSHOT: TProgressMap = {};

function emitChange() {
  listeners.forEach((l) => l());
}

function getSnapshot(): TProgressMap {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSnapshot = raw ? (JSON.parse(raw) as TProgressMap) : {};
  }
  return cachedSnapshot;
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function save(progress: TProgressMap) {
  const json = JSON.stringify(progress);
  cachedRaw = json;
  cachedSnapshot = progress;
  localStorage.setItem(STORAGE_KEY, json);
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

export default function useProgress() {
  const progress = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);

  const updatePhase = useCallback((lessonIndex: number, phase: TPhase) => {
    const current = getSnapshot();
    const existing = current[lessonIndex] ?? defaultProgress();
    const now = Date.now();

    if (phase === "complete") {
      const nextInterval = existing.completed
        ? existing.interval * 2
        : INITIAL_INTERVAL_MS;
      const retired = nextInterval >= RETIRE_THRESHOLD_MS;

      save({
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
      save({
        ...current,
        [lessonIndex]: {
          ...existing,
          phase,
        },
      });
    }
  }, []);

  const getLesson = useCallback(
    (lessonIndex: number): ILessonProgress | null => {
      return progress[lessonIndex] ?? null;
    },
    [progress],
  );

  const unretire = useCallback((lessonIndex: number) => {
    const current = getSnapshot();
    const existing = current[lessonIndex];
    if (!existing) return;

    save({
      ...current,
      [lessonIndex]: {
        ...existing,
        retired: false,
        interval: INITIAL_INTERVAL_MS,
        nextReview: Date.now() + INITIAL_INTERVAL_MS,
      },
    });
  }, []);

  return { progress, updatePhase, getLesson, unretire };
}
