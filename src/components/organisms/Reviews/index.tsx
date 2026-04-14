"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRotateLeft,
  faCircleQuestion,
  faPen,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";
import useLanguage from "@lib/useLanguage";
import useLessons from "@lib/hooks/useLessons";
import useAuth from "@lib/hooks/useAuth";
import useProgress, { getMasteryLevel } from "@lib/useProgress";
import { FREE_LESSON_COUNT } from "@lib/projectConfig";
import MasteryBar from "@/components/atoms/MasteryBar";
import Modal from "@/components/atoms/Modal";
import SignUpPrompt from "@atoms/SignUpPrompt";
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
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [resetId, setResetId] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const { language } = useLanguage();
  const { isPremium } = useAuth();
  const { getLesson, resetLesson, pausedAt } = useProgress(language);
  const { data: lessons, isLoading } = useLessons(language);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleNavReset() {
      setSelectedId(null);
    }
    window.addEventListener("nav-reset", handleNavReset);
    return () => window.removeEventListener("nav-reset", handleNavReset);
  }, []);

  const [relearningId, setRelearningId] = useState<number | null>(null);

  if (relearningId !== null) {
    return (
      <LanguageCard
        lessonId={relearningId}
        onBack={() => setRelearningId(null)}
      />
    );
  }

  if (selectedId !== null) {
    return (
      <LanguageCard
        lessonId={selectedId}
        mode="review"
        onBack={() => setSelectedId(null)}
      />
    );
  }

  if (isLoading || !lessons) {
    return null;
  }

  const effectiveNow = pausedAt ?? now;
  const freeLessonIds = new Set(
    lessons.slice(0, FREE_LESSON_COUNT).map((l) => l.id)
  );
  const ready: { id: number; translation: string; level: number }[] = [];
  const comingUp: {
    id: number;
    translation: string;
    timeLeft: number;
    level: number;
  }[] = [];
  const problematic: { id: number; translation: string; level: number }[] = [];
  let hasLockedReviews = false;

  lessons.forEach((lesson) => {
    const p = getLesson(lesson.id);
    if (!p || !p.completed || p.retired) return;

    if (!isPremium && !freeLessonIds.has(lesson.id)) {
      hasLockedReviews = true;
      return;
    }
    const level = getMasteryLevel(p);
    const passCount = p.reviewPassCount ?? 0;
    const failCount = p.reviewFailCount ?? 0;
    const consec = p.consecutiveFails ?? 0;
    const isProblematic =
      consec >= 2 || (failCount > passCount && passCount + failCount >= 3);

    if (isProblematic) {
      problematic.push({
        id: lesson.id,
        translation: lesson.translation,
        level,
      });
    } else if (p.nextReview && p.nextReview <= effectiveNow) {
      ready.push({ id: lesson.id, translation: lesson.translation, level });
    } else if (p.nextReview && p.nextReview > effectiveNow) {
      comingUp.push({
        id: lesson.id,
        translation: lesson.translation,
        timeLeft: p.nextReview - effectiveNow,
        level,
      });
    }
  });

  comingUp.sort((a, b) => a.timeLeft - b.timeLeft);

  return (
    <div className={styles.container}>
      <section>
        <h2 className={styles.sectionTitle}>Ready for review</h2>
        {ready.length > 0 && (
          <div className={styles.list}>
            {ready.map(({ id, translation, level }) => (
              <div key={id} className={styles.itemRow}>
                <button
                  className={`${styles.item} ${styles.ready}`}
                  onClick={() => setSelectedId(id)}
                >
                  <span className={`${styles.number} ${styles.numberReady}`}>
                    <FontAwesomeIcon icon={faPen} />
                  </span>
                  <div className={styles.itemContent}>
                    <p className={styles.sentence}>{translation}</p>
                    <MasteryBar level={level} />
                  </div>
                </button>
                <button
                  className={styles.resetBtn}
                  onClick={() => setResetId(id)}
                >
                  <FontAwesomeIcon icon={faRotateLeft} />
                </button>
              </div>
            ))}
          </div>
        )}
        {ready.length === 0 && (
          <p className={styles.emptyText}>Nothing to review yet...</p>
        )}
      </section>

      {problematic.length > 0 && (
        <section>
          <h2 className={styles.sectionTitle}>Needs Attention</h2>
          <div className={styles.list}>
            {problematic.map(({ id, translation, level }) => (
              <div key={id} className={styles.itemRow}>
                <button
                  className={`${styles.item} ${styles.problematic}`}
                  onClick={() => setRelearningId(id)}
                >
                  <span className={`${styles.number} ${styles.numberProblematic}`}>
                    <FontAwesomeIcon icon={faTriangleExclamation} />
                  </span>
                  <div className={styles.itemContent}>
                    <p className={styles.sentence}>{translation}</p>
                    <div className={styles.tagRow}>
                      <MasteryBar level={level} />
                      <p className={styles.tag}>Go back to learn</p>
                    </div>
                  </div>
                </button>
                <button
                  className={styles.resetBtn}
                  onClick={() => setResetId(id)}
                >
                  <FontAwesomeIcon icon={faRotateLeft} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Coming Up</h2>
          <button
            className={styles.infoBtn}
            onClick={() => setShowInfo(true)}
          >
            <FontAwesomeIcon icon={faCircleQuestion} />
          </button>
        </div>
        {comingUp.length > 0 && (
          <div className={styles.list}>
            {comingUp.map(({ id, translation, timeLeft, level }) => (
              <div key={id} className={styles.itemRow}>
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
                    <p className={styles.sentence}>{translation}</p>
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
                  onClick={() => setResetId(id)}
                >
                  <FontAwesomeIcon icon={faRotateLeft} />
                </button>
              </div>
            ))}
          </div>
        )}
        {comingUp.length === 0 && (
          <p className={styles.emptyText}>Nothing coming up yet...</p>
        )}
      </section>

      {hasLockedReviews && (
        <SignUpPrompt message="Go Premium to unlock reviews for all lessons." />
      )}

      {showInfo && (
        <Modal onClose={() => setShowInfo(false)}>
          <p className={styles.resetTitle}>How reviews work</p>
          <p className={styles.infoMessage}>
            Reviews use spaced repetition to help you remember what you{"\u2019"}ve
            learned. After completing a lesson, it moves here for review.
          </p>
          <p className={styles.infoMessage}>
            Each time you pass a review, the interval before the next one doubles.
            If you fail, you{"\u2019"}ll go back to practice before trying again.
          </p>
          <p className={styles.infoMessage}>
            Over time, the intervals grow longer until the sentence is fully
            mastered and retired.
          </p>
        </Modal>
      )}

      {resetId !== null && (
        <Modal onClose={() => setResetId(null)}>
          <p className={styles.resetTitle}>Reset progress?</p>
          <p className={styles.resetMessage}>
            This will reset your progress back to zero for this lesson. You can
            take it again from the beginning.
          </p>
          <div className={styles.resetActions}>
            <button
              className={styles.resetCancel}
              onClick={() => setResetId(null)}
            >
              Cancel
            </button>
            <button
              className={styles.resetConfirm}
              onClick={() => {
                resetLesson(resetId);
                setResetId(null);
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
