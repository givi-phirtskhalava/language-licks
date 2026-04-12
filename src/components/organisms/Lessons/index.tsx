"use client";

import { useState } from "react";
import { getLessons } from "@lib/lessons";
import useLanguage from "@lib/useLanguage";
import useProgress, { getMasteryLevel } from "@lib/useProgress";
import MasteryBar from "@/components/atoms/MasteryBar";
import classNames from "classnames";
import LanguageCard from "@/components/organisms/LanguageCard";
import styles from "./Lessons.module.css";

export default function Lessons() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { language } = useLanguage();
  const { progress, getLesson, unretire } = useProgress(language);
  const lessons = getLessons(language);

  if (selectedIndex !== null) {
    return (
      <LanguageCard
        lessonIndex={selectedIndex}
        onBack={() => setSelectedIndex(null)}
      />
    );
  }

  return (
    <div className={styles.container}>
      <section>
        <h2 className={styles.sectionTitle}>Lessons</h2>
        <div className={styles.list}>
          {lessons.map((lesson, index) => {
            const p = getLesson(index);
            const completed = p?.completed && !p.retired;
            const retired = p?.retired;
            const level = getMasteryLevel(p);

            return (
              <button
                key={index}
                className={classNames(
                  styles.item,
                  completed && styles.completedItem,
                  retired && styles.retiredItem
                )}
                onClick={() => {
                  if (retired) {
                    unretire(index);
                  } else {
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
