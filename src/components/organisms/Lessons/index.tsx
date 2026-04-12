"use client";

import { useState } from "react";
import useLanguage from "@lib/useLanguage";
import useLessons from "@lib/hooks/useLessons";
import useProgress, { getMasteryLevel } from "@lib/useProgress";
import MasteryBar from "@/components/atoms/MasteryBar";
import classNames from "classnames";
import LanguageCard from "@/components/organisms/LanguageCard";
import styles from "./Lessons.module.css";

export default function Lessons() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { language } = useLanguage();
  const { progress, getLesson, unretire } = useProgress(language);
  const { data: lessons, isLoading } = useLessons(language);

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

  return (
    <div className={styles.container}>
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
