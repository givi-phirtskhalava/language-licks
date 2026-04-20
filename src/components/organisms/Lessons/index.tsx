"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartSimple } from "@fortawesome/free-solid-svg-icons";
import useLanguage from "@lib/useLanguage";
import useLessons from "@lib/hooks/useLessons";
import useProgress, { getMasteryLevel } from "@lib/useProgress";
import { CEFR_LEVELS, TCefrLevel } from "@lib/types";
import MasteryBar from "@/components/atoms/MasteryBar";
import LessonSettings from "@/components/atoms/LessonSettings";
import classNames from "classnames";
import LanguageCard from "@/components/organisms/LanguageCard";
import LessonFilters from "@/components/organisms/LessonFilters";
import StatsPanel from "@/components/atoms/StatsPanel";
import styles from "./Lessons.module.css";

const LEVEL_STORAGE_KEY = "lessons:cefrLevel";

export default function Lessons() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [settingsId, setSettingsId] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [level, setLevel] = useState<TCefrLevel>("A1");
  const { language } = useLanguage();

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
  const { data: lessons, isLoading } = useLessons(language);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const openParam = params.get("open");
    if (openParam) {
      setSelectedId(Number(openParam));
      window.history.replaceState({}, "", "/lessons");
    }
  }, []);

  useEffect(() => {
    function handleNavReset() {
      setSelectedId(null);
    }
    window.addEventListener("nav-reset", handleNavReset);
    return () => window.removeEventListener("nav-reset", handleNavReset);
  }, []);

  if (selectedId !== null) {
    return (
      <LanguageCard
        lessonId={selectedId}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  if (isLoading || !lessons) {
    return null;
  }

  const settingsLesson = settingsId !== null ? getLesson(settingsId) : null;

  const filteredLessons = lessons
    .map((lesson, index) => ({ lesson, index }))
    .filter(({ lesson }) => lesson.cefr === level)
    .filter(({ lesson }) => {
      if (selectedTags.length === 0) return true;
      return selectedTags.some((tag) => lesson.tags.includes(tag));
    });

  return (
    <div className={styles.container}>
      <StatsPanel progress={progress} dailyLog={dailyLog} />

      <section>
        <h2 className={styles.sectionTitle}>Lessons</h2>

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

        {filteredLessons.length === 0 && (
          <p className={styles.emptyState}>
            No lessons match the selected filters.
          </p>
        )}

        {filteredLessons.length > 0 && (
          <div className={styles.list}>
            {filteredLessons.map(({ lesson, index }) => {
              const p = getLesson(lesson.id);
              const completed = p?.completed && !p.retired;
              const retired = p?.retired;
              const level = getMasteryLevel(p);
              const hasProgress = p && (p.completed || p.phase !== "lesson");

              return (
                <div key={lesson.id} className={styles.item}>
                  <button
                    className={classNames(
                      styles.itemBtn,
                      completed && styles.completedItem,
                      retired && styles.retiredItem
                    )}
                    onClick={() => setSelectedId(lesson.id)}
                  >
                    <span
                      className={classNames(
                        styles.number,
                        completed && styles.numberCompleted,
                        retired && styles.numberRetired
                      )}
                    >
                      {completed || retired ? "\u2713" : index + 1}
                    </span>
                    <div className={styles.itemContent}>
                      <p className={styles.sentence}>{lesson.sentence}</p>
                      {p && !p.completed && (
                        <p className={styles.tag}>In progress</p>
                      )}
                      {completed && <MasteryBar level={level} />}
                      {retired && (
                        <p className={styles.tag}>
                          {"Mastered \u2014 tap to review"}
                        </p>
                      )}
                    </div>
                  </button>
                  {hasProgress && (
                    <button
                      className={styles.gearBtn}
                      onClick={() => setSettingsId(lesson.id)}
                    >
                      <FontAwesomeIcon icon={faChartSimple} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

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
    </div>
  );
}
