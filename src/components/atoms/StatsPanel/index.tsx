"use client";

import { ILessonProgress, TDailyLog } from "@lib/types";
import {
  getMasteryLevel,
  getTodayKey,
  calculateStreak,
  MAX_MASTERY_LEVEL,
} from "@lib/useProgress";
import classNames from "classnames";
import styles from "./StatsPanel.module.css";

interface Props {
  progress: Record<number, ILessonProgress>;
  dailyLog: TDailyLog;
}

export default function StatsPanel({ progress, dailyLog }: Props) {
  const today = getTodayKey();
  const todayEntry = dailyLog[today];
  const lessonsToday = todayEntry?.l ?? 0;
  const reviewsToday = todayEntry?.r ?? 0;
  const goalMet = lessonsToday >= 1;

  const streak = calculateStreak(dailyLog);

  let totalCompleted = 0;
  let lifetimeReviews = 0;
  const levelCounts = new Array(MAX_MASTERY_LEVEL + 1).fill(0);
  const now = Date.now();
  let reviewsDue = 0;

  const entries = Object.values(progress);
  for (const p of entries) {
    if (p.completed) {
      totalCompleted++;
      const level = getMasteryLevel(p);
      levelCounts[level]++;
      lifetimeReviews += p.reviewPassCount ?? 0;
      if (!p.retired && p.nextReview && p.nextReview <= now) {
        reviewsDue++;
      }
    }
  }
  const totalMastered = levelCounts[MAX_MASTERY_LEVEL];

  function getLevelColor(i: number): string {
    const t = (i - 1) / (MAX_MASTERY_LEVEL - 1);
    const h = 210 + (140 - 210) * t;
    const s = 60 + (50 - 60) * t;
    const l = 92 + (85 - 92) * t;
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  return (
    <div className={styles.container}>
      <div className={styles.checklist}>
        <p className={styles.checklistTitle}>Today's goals</p>

        <div className={styles.checkItem}>
          {goalMet && <span className={styles.checkEmoji}>&#x2705;</span>}
          {!goalMet && <span className={styles.uncheckCircle} />}
          <span
            className={classNames(
              styles.checkLabel,
              goalMet && styles.checkLabelDone
            )}
          >
            Learn a new lesson
          </span>
        </div>

        {reviewsDue > 0 && (
          <div className={styles.checkItem}>
            <span className={styles.uncheckCircle} />
            <span className={styles.checkLabel}>
              Complete {reviewsDue} review{reviewsDue !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {reviewsDue === 0 && reviewsToday > 0 && (
          <div className={styles.checkItem}>
            <span className={styles.checkEmoji}>&#x2705;</span>
            <span
              className={classNames(styles.checkLabel, styles.checkLabelDone)}
            >
              Reviews complete
            </span>
          </div>
        )}
      </div>

      <div className={styles.grid}>
        <div className={styles.stat}>
          <p className={styles.statValue}>{streak}</p>
          <p className={styles.statLabel}>Day streak</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statValue}>{totalCompleted}</p>
          <p className={styles.statLabel}>Learned</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statValue}>{totalMastered}</p>
          <p className={styles.statLabel}>Mastered</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statValue}>{lifetimeReviews}</p>
          <p className={styles.statLabel}>Reviews</p>
        </div>
      </div>

      {totalCompleted > 0 && (
        <div className={styles.progress}>
          <p className={styles.progressTitle}>Your progress</p>
          <div className={styles.levelSquares}>
            {levelCounts.map((count, i) => {
              if (i === 0) return null;
              return (
                <div key={i} className={styles.levelSquareWrapper}>
                  <span className={styles.levelSquareLabel}>lvl.{i}</span>
                  <div
                    className={classNames(
                      styles.levelSquare,
                      count === 0 && styles.levelSquareEmpty
                    )}
                    style={{ background: getLevelColor(i) }}
                  >
                    <span className={styles.levelSquareCount}>{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
