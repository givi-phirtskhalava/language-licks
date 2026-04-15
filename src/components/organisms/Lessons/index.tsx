"use client";

import { useState, useEffect } from "react";
import useLanguage from "@lib/useLanguage";
import useLessons from "@lib/hooks/useLessons";
import useAuth from "@lib/hooks/useAuth";
import useProgress, { getMasteryLevel } from "@lib/useProgress";
import { FREE_LESSON_COUNT } from "@lib/projectConfig";
import MasteryBar from "@/components/atoms/MasteryBar";
import classNames from "classnames";
import LanguageCard from "@/components/organisms/LanguageCard";
import StatsPanel from "@/components/atoms/StatsPanel";
import styles from "./Lessons.module.css";

export default function Lessons() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const { language } = useLanguage();
  const { isPremium } = useAuth();
  const { progress, dailyLog, getLesson, unretire } = useProgress(language);
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
    const isFree = selectedIndex < FREE_LESSON_COUNT || isPremium;
    return (
      <LanguageCard
        lessonId={selectedId}
        isFree={isFree}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  if (isLoading || !lessons) {
    return null;
  }

  return (
    <div className={styles.container}>
      <StatsPanel
        progress={progress}
        dailyLog={dailyLog}
        totalLessons={lessons.length}
      />

      <section>
        <h2 className={styles.sectionTitle}>Lessons</h2>
        <div className={styles.list}>
          {lessons.map((lesson, index) => {
            const p = getLesson(lesson.id);
            const completed = p?.completed && !p.retired;
            const retired = p?.retired;
            const level = getMasteryLevel(p);

            return (
              <button
                key={lesson.id}
                className={classNames(
                  styles.item,
                  completed && styles.completedItem,
                  retired && styles.retiredItem
                )}
                onClick={() => {
                  if (retired) {
                    unretire(lesson.id);
                  } else {
                    setSelectedId(lesson.id);
                    setSelectedIndex(index);
                  }
                }}
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
                      {"Mastered \u2014 Review again"}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
