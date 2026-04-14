"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faBullseye } from "@fortawesome/free-solid-svg-icons";
import { ILessonProgress, TDailyLog } from "@lib/types";
import { getMasteryLevel, getTodayKey, calculateStreak, MAX_MASTERY_LEVEL } from "@lib/useProgress";
import classNames from "classnames";
import styles from "./StatsPanel.module.css";

interface Props {
  progress: Record<number, ILessonProgress>;
  dailyLog: TDailyLog;
  dailyTarget: number;
}

const LEVEL_LABELS = [
  "New",
  "Lv 1",
  "Lv 2",
  "Lv 3",
  "Lv 4",
  "Lv 5",
  "Lv 6",
  "Lv 7",
  "Lv 8",
  "Mastered",
];

export default function StatsPanel({ progress, dailyLog, dailyTarget }: Props) {
  const today = getTodayKey();
  const todayEntry = dailyLog[today];
  const lessonsToday = todayEntry?.l ?? 0;
  const reviewsToday = todayEntry?.r ?? 0;
  const goalMet = lessonsToday >= dailyTarget;

  const streak = calculateStreak(dailyLog);

  let totalCompleted = 0;
  let lifetimeReviews = 0;
  const levelCounts = new Array(MAX_MASTERY_LEVEL + 1).fill(0);

  const entries = Object.values(progress);
  for (const p of entries) {
    if (p.completed) {
      totalCompleted++;
      const level = getMasteryLevel(p);
      levelCounts[level]++;
      lifetimeReviews += p.reviewPassCount ?? 0;
    }
  }
  const totalMastered = levelCounts[MAX_MASTERY_LEVEL];

  const maxLevelCount = Math.max(1, ...levelCounts);

  return (
    <div className={styles.container}>
      <div className={styles.dailyGoal}>
        <div
          className={classNames(
            styles.checkCircle,
            goalMet && styles.checkComplete,
            !goalMet && styles.checkIncomplete
          )}
        >
          {goalMet && <FontAwesomeIcon icon={faCircleCheck} />}
          {!goalMet && <FontAwesomeIcon icon={faBullseye} />}
        </div>
        <div className={styles.goalText}>
          {goalMet && (
            <p className={styles.goalTitle}>Daily goal complete!</p>
          )}
          {!goalMet && (
            <p className={styles.goalTitle}>
              {lessonsToday} / {dailyTarget} lessons today
            </p>
          )}
          <p className={styles.goalSub}>
            {reviewsToday > 0 && `${reviewsToday} review${reviewsToday !== 1 ? "s" : ""} today`}
            {reviewsToday === 0 && !goalMet && "Keep going!"}
            {reviewsToday === 0 && goalMet && "Great work!"}
          </p>
        </div>
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
        <div>
          {levelCounts.map((count, i) => {
            if (i === 0) return null;
            return (
              <div key={i} className={styles.levelRow}>
                <span className={styles.levelLabel}>{LEVEL_LABELS[i]}</span>
                <div className={styles.levelBar}>
                  <div
                    className={styles.levelFill}
                    style={{ width: `${(count / maxLevelCount) * 100}%` }}
                  />
                </div>
                <span className={styles.levelCount}>{count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
