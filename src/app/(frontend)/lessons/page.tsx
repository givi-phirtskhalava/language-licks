"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import useLanguage from "@lib/useLanguage";
import useLessons from "@lib/hooks/useLessons";
import useProgress from "@lib/useProgress";
import { CEFR_LEVELS, TCefrLevel } from "@lib/types";
import LessonSettings from "@/components/atoms/LessonSettings";
import classNames from "classnames";
import LessonFilters from "@/components/organisms/LessonFilters";
import LessonItem from "@/components/organisms/LessonItem";
import StatsPanel from "@/components/atoms/StatsPanel";
import styles from "./Lessons.module.css";

const LEVEL_STORAGE_KEY = "lessons:cefrLevel";

export default function Lessons() {
  const [settingsId, setSettingsId] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [level, setLevel] = useState<TCefrLevel>("A1");
  const { language } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem(LEVEL_STORAGE_KEY);
    if (stored && CEFR_LEVELS.includes(stored as TCefrLevel)) {
      setLevel(stored as TCefrLevel);
    }
  }, []);

  function handleLevelChange(next: TCefrLevel) {
    setLevel(next);
    localStorage.setItem(LEVEL_STORAGE_KEY, next);
  }
  const { progress, dailyLog, getLesson, unretire, resetLesson } =
    useProgress(language);
  const { data: lessons, isLoading, error } = useLessons(language);

  if (isLoading) {
    return null;
  }

  if (error || !lessons) {
    return (
      <div className={styles.container}>
        <p className={styles.emptyState}>
          Something went wrong loading lessons. Please check back later.
        </p>
      </div>
    );
  }

  const settingsLesson = settingsId !== null ? getLesson(settingsId) : null;

  const filteredLessons = lessons
    .filter((lesson) => lesson.cefr === level)
    .filter((lesson) => {
      if (selectedTags.length === 0) return true;
      return selectedTags.some((tag) => lesson.tags.includes(tag));
    })
    .map((lesson, index) => ({ lesson, index }));

  return (
    <div className={styles.container}>
      <StatsPanel progress={progress} dailyLog={dailyLog} />

      <section>
        <div className={styles.stickyHeader}>
          <div className={styles.levelTabs} role="tablist">
            {CEFR_LEVELS.map((l) => (
              <button
                key={l}
                role="tab"
                aria-selected={l === level}
                className={classNames(
                  styles.levelTab,
                  l === level && styles.levelTabActive
                )}
                onClick={() => handleLevelChange(l)}
              >
                {l}
              </button>
            ))}
          </div>

          <div className={styles.filters}>
            <LessonFilters
              language={language}
              selectedTags={selectedTags}
              onChange={setSelectedTags}
            />
          </div>
        </div>

        {filteredLessons.length === 0 && (
          <p className={styles.emptyState}>
            No lessons match the selected filters.
          </p>
        )}

        {filteredLessons.length > 0 && (
          <div className={styles.list}>
            {filteredLessons.map(({ lesson, index }) => (
              <LessonItem
                key={lesson.id}
                type="lesson"
                lesson={lesson}
                index={index}
                onClick={() => router.push(`/lessons/${language}/${lesson.id}`)}
                onSettingsClick={() => setSettingsId(lesson.id)}
              />
            ))}
          </div>
        )}
      </section>

      <AnimatePresence>
        {settingsId !== null && settingsLesson && (
          <LessonSettings
            lessonProgress={settingsLesson}
            onUnretire={() => {
              unretire(settingsId);
              setSettingsId(null);
            }}
            onReset={() => {
              resetLesson(settingsId);
              setSettingsId(null);
            }}
            onClose={() => setSettingsId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
