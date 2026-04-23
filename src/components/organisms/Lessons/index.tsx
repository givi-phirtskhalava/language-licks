"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import useLanguage from "@lib/useLanguage";
import useLessons from "@lib/hooks/useLessons";
import useAuth from "@lib/hooks/useAuth";
import useProgress, { getMasteryLevel } from "@lib/useProgress";
import { CEFR_LEVELS, TCefrLevel } from "@lib/types";
import MasteryBar from "@/components/atoms/MasteryBar";
import LessonSettings from "@/components/atoms/LessonSettings";
import classNames from "classnames";
import LessonFilters from "@/components/organisms/LessonFilters";
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
  const { data: lessons, isLoading } = useLessons(language);
  const { isPremium } = useAuth();

  if (isLoading || !lessons) {
    return null;
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
            {filteredLessons.map(({ lesson, index }) => {
              const p = getLesson(lesson.id);
              const completed = p?.completed && !p.retired;
              const retired = p?.retired;
              const level = getMasteryLevel(p);
              const hasProgress = p && (p.completed || p.phase !== "lesson");

              function openLesson() {
                router.push(`/lessons/${language}/${lesson.id}`);
              }

              return (
                <div
                  key={lesson.id}
                  className={styles.item}
                  role="button"
                  tabIndex={0}
                  onClick={openLesson}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openLesson();
                    }
                  }}
                  aria-label={`Open lesson ${index + 1}: ${lesson.sentence}`}
                >
                  <div className={styles.itemBtn}>
                    <span
                      className={classNames(
                        styles.number,
                        completed && styles.numberCompleted,
                        retired && styles.numberRetired
                      )}
                    >
                      {index + 1}
                    </span>

                    <div className={styles.itemContent}>
                      <p className={styles.sentence}>{lesson.sentence}</p>

                      {p && !p.completed && (
                        <p className={styles.tag}>In progress</p>
                      )}

                      {retired && (
                        <p className={styles.tag}>
                          {"Mastered \u2014 tap to review"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={styles.statusRow}>
                    {!isPremium && lesson.isFree && (
                      <span className={styles.freeBadge}>Free</span>
                    )}

                    {completed && <MasteryBar level={level} />}

                    {(completed || retired) && (
                      <span className={styles.check} aria-label="Completed">
                        {"\u2713"}
                      </span>
                    )}

                    {hasProgress && (
                      <button
                        className={styles.gearBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSettingsId(lesson.id);
                        }}
                        aria-label="Lesson info and stats"
                      >
                        <FontAwesomeIcon icon={faCircleInfo} />
                      </button>
                    )}
                  </div>
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
