"use client";

import { useCallback, useSyncExternalStore } from "react";
import { TLanguageId, DEFAULT_LANGUAGE } from "./projectConfig";

const STORAGE_KEY = "current-language";

let listeners: (() => void)[] = [];
let cachedRaw: string | null = null;
let cachedSnapshot: TLanguageId = DEFAULT_LANGUAGE;

function emitChange() {
  listeners.forEach((l) => l());
}

function getSnapshot(): TLanguageId {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSnapshot = (raw as TLanguageId) || DEFAULT_LANGUAGE;
  }
  return cachedSnapshot;
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export default function useLanguage() {
  const language = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => DEFAULT_LANGUAGE
  );

  const setLanguage = useCallback((lang: TLanguageId) => {
    cachedRaw = lang;
    cachedSnapshot = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    emitChange();
  }, []);

  return { language, setLanguage };
}
