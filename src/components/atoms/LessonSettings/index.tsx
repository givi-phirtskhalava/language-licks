"use client";

import { useState } from "react";
import { ILessonProgress } from "@lib/types";
import { getMasteryLevel, MAX_MASTERY_LEVEL } from "@lib/useProgress";
import Modal from "@/components/atoms/Modal";
import styles from "./LessonSettings.module.css";

interface Props {
  lessonProgress: ILessonProgress;
  onUnretire: () => void;
  onReset: () => void;
  onClose: () => void;
}

export default function LessonSettings({
  lessonProgress,
  onUnretire,
  onReset,
  onClose,
}: Props) {
  const [confirmReset, setConfirmReset] = useState(false);
  const level = getMasteryLevel(lessonProgress);

  return (
    <Modal onClose={onClose}>
      <p className={styles.modalTitle}>Lesson Stats</p>

      <div className={styles.statsList}>
        <div className={styles.statsRow}>
          <span className={styles.statsLabel}>Level</span>
          <span className={styles.statsValue}>
            {lessonProgress.retired
              ? "Mastered"
              : `${level} / ${MAX_MASTERY_LEVEL}`}
          </span>
        </div>

        <div className={styles.statsRow}>
          <span className={styles.statsLabel}>Reviews passed</span>
          <span className={styles.statsValue}>
            {lessonProgress.reviewPassCount ?? 0}
          </span>
        </div>

        <div className={styles.statsRow}>
          <span className={styles.statsLabel}>Reviews failed</span>
          <span className={styles.statsValue}>
            {lessonProgress.reviewFailCount ?? 0}
          </span>
        </div>
      </div>

      {lessonProgress.retired && (
        <button className={styles.unretireBtn} onClick={onUnretire}>
          Unretire lesson
        </button>
      )}

      {!confirmReset && (
        <button
          className={styles.resetBtn}
          onClick={() => setConfirmReset(true)}
        >
          Reset progress
        </button>
      )}

      {confirmReset && (
        <div className={styles.confirmReset}>
          <p className={styles.confirmText}>
            This will reset all progress for this lesson.
          </p>
          <div className={styles.confirmActions}>
            <button
              className={styles.confirmCancel}
              onClick={() => setConfirmReset(false)}
            >
              Cancel
            </button>
            <button className={styles.confirmBtn} onClick={onReset}>
              Reset
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
