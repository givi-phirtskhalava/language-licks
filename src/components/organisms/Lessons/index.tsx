"use client";

import { useState } from "react";
import { LESSONS } from "@lib/lessons";
import useProgress from "@lib/useProgress";
import LanguageCard from "@/components/organisms/LanguageCard";
import styles from "./Lessons.module.css";

function formatTimeUntil(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function Lessons() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { progress, getLesson, unretire } = useProgress();

  if (selectedIndex !== null) {
    return (
      <LanguageCard
        lessonIndex={selectedIndex}
        onBack={() => setSelectedIndex(null)}
      />
    );
  }

  const now = Date.now();
  const newLessons: number[] = [];
  const dueForReview: number[] = [];
  const upcoming: number[] = [];
  const retired: number[] = [];

  LESSONS.forEach((_, index) => {
    const p = getLesson(index);
    if (!p || !p.completed) {
      newLessons.push(index);
    } else if (p.retired) {
      retired.push(index);
    } else if (p.nextReview && p.nextReview <= now) {
      dueForReview.push(index);
    } else {
      upcoming.push(index);
    }
  });

  return (
    <div className={styles.container}>
      {dueForReview.length > 0 && (
        <section>
          <h2 className={styles.sectionTitle}>Review Now</h2>
          <div className={styles.list}>
            {dueForReview.map((index) => (
              <button
                key={index}
                className={`${styles.item} ${styles.review}`}
                onClick={() => setSelectedIndex(index)}
              >
                <span className={`${styles.number} ${styles.numberReview}`}>!</span>
                <p className={styles.sentence}>{LESSONS[index].sentence}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {newLessons.length > 0 && (
        <section>
          <h2 className={styles.sectionTitle}>Lessons</h2>
          <div className={styles.list}>
            {newLessons.map((index) => {
              const p = getLesson(index);
              return (
                <button
                  key={index}
                  className={styles.item}
                  onClick={() => setSelectedIndex(index)}
                >
                  <span className={styles.number}>{index + 1}</span>
                  <div className={styles.itemContent}>
                    <p className={styles.sentence}>{LESSONS[index].sentence}</p>
                    {p && !p.completed && (
                      <p className={styles.tag}>In progress</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className={styles.sectionTitle}>Upcoming Reviews</h2>
          <div className={styles.list}>
            {upcoming.map((index) => {
              const p = getLesson(index)!;
              const timeLeft = p.nextReview! - now;
              return (
                <button
                  key={index}
                  className={`${styles.item} ${styles.upcoming}`}
                  onClick={() => setSelectedIndex(index)}
                >
                  <span className={`${styles.number} ${styles.numberUpcoming}`}>
                    {"\u2713"}
                  </span>
                  <div className={styles.itemContent}>
                    <p className={styles.sentence}>{LESSONS[index].sentence}</p>
                    <p className={styles.tag}>
                      {"Review in "}
                      {formatTimeUntil(timeLeft)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {retired.length > 0 && (
        <section>
          <h2 className={styles.sectionTitle}>Completed</h2>
          <div className={styles.list}>
            {retired.map((index) => (
              <div key={index} className={`${styles.item} ${styles.retiredItem}`}>
                <span className={`${styles.number} ${styles.numberRetired}`}>
                  {"\u2713"}
                </span>
                <div className={styles.itemContent}>
                  <p className={styles.sentence}>{LESSONS[index].sentence}</p>
                  <button
                    className={styles.restartBtn}
                    onClick={() => unretire(index)}
                  >
                    Review again
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
