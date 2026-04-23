"use client";

import { ILessonProgress, TDailyLog } from "@lib/types";
import {
  getMasteryLevel,
  getToday,
  calculateStreak,
  MAX_MASTERY_LEVEL,
} from "@lib/useProgress";
import styles from "./StatsPanel.module.css";

interface Props {
  progress: Record<number, ILessonProgress>;
  dailyLog: TDailyLog;
}

export default function StatsPanel({ progress, dailyLog }: Props) {
  const streak = calculateStreak(dailyLog);

  let totalCompleted = 0;
  let lifetimeReviews = 0;
  const levelCounts = new Array(MAX_MASTERY_LEVEL + 1).fill(0);
  const todayDate = getToday();
  let reviewsDue = 0;

  const entries = Object.values(progress);
  for (const p of entries) {
    if (p.completed) {
      totalCompleted++;
      const level = getMasteryLevel(p);
      levelCounts[level]++;
      lifetimeReviews += p.reviewPassCount ?? 0;
      if (!p.retired && p.nextReview && p.nextReview <= todayDate) {
        reviewsDue++;
      }
    }
  }
  const totalMastered = levelCounts[MAX_MASTERY_LEVEL];

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        <div className={styles.stat}>
          <p className={styles.statValue}>{streak}</p>
          <p className={styles.statLabel}>Day Streak</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statValue}>{totalCompleted}</p>
          <p className={styles.statLabel}>Learned</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statValue}>{totalMastered}</p>
          <p className={styles.statLabel}>Mastered</p>
        </div>
      </div>
    </div>
  );
}
