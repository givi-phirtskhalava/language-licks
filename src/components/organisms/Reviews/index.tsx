"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";
import { getLessons } from "@lib/lessons";
import useLanguage from "@lib/useLanguage";
import useProgress, { getMasteryLevel } from "@lib/useProgress";
import MasteryBar from "@/components/atoms/MasteryBar";
import Modal from "@/components/atoms/Modal";
import LanguageCard from "@/components/organisms/LanguageCard";
import styles from "./Reviews.module.css";

function formatTimeUntil(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 10) return `${minutes}m ${seconds}s`;
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function Reviews() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [resetIndex, setResetIndex] = useState<number | null>(null);
  const { language } = useLanguage();
  const { getLesson, resetLesson, pausedAt } = useProgress(language);
  const lessons = getLessons(language);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleNavReset() {
      setSelectedIndex(null);
    }
    window.addEventListener("nav-reset", handleNavReset);
    return () => window.removeEventListener("nav-reset", handleNavReset);
  }, []);

  if (selectedIndex !== null) {
    return (
      <LanguageCard
        lessonIndex={selectedIndex}
        mode="review"
        onBack={() => setSelectedIndex(null)}
      />
    );
  }

  const effectiveNow = pausedAt ?? now;
  const ready: { index: number; level: number }[] = [];
  const comingUp: { index: number; timeLeft: number; level: number }[] = [];

  lessons.forEach((_, index) => {
    const p = getLesson(index);
    if (!p || !p.completed || p.retired) return;
    const level = getMasteryLevel(p);

    if (p.nextReview && p.nextReview <= effectiveNow) {
      ready.push({ index, level });
    } else if (p.nextReview && p.nextReview > effectiveNow) {
      comingUp.push({
        index,
        timeLeft: p.nextReview - effectiveNow,
        level,
      });
    }
  });

  comingUp.sort((a, b) => a.timeLeft - b.timeLeft);

  return (
    <div className={styles.container}>
      {ready.length > 0 && (
        <section>
          <h2 className={styles.sectionTitle}>Ready</h2>
          <div className={styles.list}>
            {ready.map(({ index, level }) => (
              <div key={index} className={styles.itemRow}>
                <button
                  className={`${styles.item} ${styles.ready}`}
                  onClick={() => setSelectedIndex(index)}
                >
                  <span className={`${styles.number} ${styles.numberReady}`}>
                    !
                  </span>
                  <div className={styles.itemContent}>
                    <p className={styles.sentence}>
                      {lessons[index].translation}
                    </p>
                    <MasteryBar level={level} />
                  </div>
                </button>
                <button
                  className={styles.resetBtn}
                  onClick={() => setResetIndex(index)}
                >
                  <FontAwesomeIcon icon={faRotateLeft} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {comingUp.length > 0 && (
        <section>
          <h2 className={styles.sectionTitle}>Coming Up</h2>
          <div className={styles.list}>
            {comingUp.map(({ index, timeLeft, level }) => (
              <div key={index} className={styles.itemRow}>
                <button
                  className={`${styles.item} ${styles.comingUp}`}
                  onClick={() => {
                    toast.dismiss();
                    toast.error(
                      pausedAt
                        ? "Reviews are paused"
                        : "Not ready yet! Review in " +
                            formatTimeUntil(timeLeft)
                    );
                  }}
                >
                  <span className={`${styles.number} ${styles.numberComingUp}`}>
                    {"\u2713"}
                  </span>
                  <div className={styles.itemContent}>
                    <p className={styles.sentence}>
                      {lessons[index].translation}
                    </p>
                    <div className={styles.tagRow}>
                      <MasteryBar level={level} />
                      <p className={styles.tag}>
                        {pausedAt
                          ? "Paused"
                          : "Review in " + formatTimeUntil(timeLeft)}
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  className={styles.resetBtn}
                  onClick={() => setResetIndex(index)}
                >
                  <FontAwesomeIcon icon={faRotateLeft} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {ready.length === 0 && comingUp.length === 0 && (
        <p className={styles.tag}>No reviews yet. Complete some lessons first.</p>
      )}

      {resetIndex !== null && (
        <Modal onClose={() => setResetIndex(null)}>
          <p className={styles.resetTitle}>Reset progress?</p>
          <p className={styles.resetMessage}>
            This will reset your progress back to zero for this lesson. You can
            take it again from the beginning.
          </p>
          <div className={styles.resetActions}>
            <button
              className={styles.resetCancel}
              onClick={() => setResetIndex(null)}
            >
              Cancel
            </button>
            <button
              className={styles.resetConfirm}
              onClick={() => {
                resetLesson(resetIndex);
                setResetIndex(null);
              }}
            >
              Reset
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
