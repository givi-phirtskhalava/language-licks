"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleQuestion,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { faClock, faSparkles } from "@fortawesome/pro-regular-svg-icons";
import toast from "react-hot-toast";
import useLanguage from "@lib/useLanguage";
import useLessons from "@lib/hooks/useLessons";
import useAuth from "@lib/hooks/useAuth";
import useProgress, { getMasteryLevel, getToday } from "@lib/useProgress";
import LessonSettings from "@/components/atoms/LessonSettings";
import CardFooter from "@/components/atoms/CardFooter";
import SignUpPrompt from "@atoms/SignUpPrompt";
import LanguageCard from "@/components/organisms/LanguageCard";
import styles from "./Reviews.module.css";

export default function Reviews() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [settingsId, setSettingsId] = useState<number | null>(null);
  const { language } = useLanguage();
  const { isPremium } = useAuth();
  const { getLesson, unretire, resetLesson, pausedAt } = useProgress(language);
  const { data: lessons, isLoading } = useLessons(language);

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
        key={selectedId}
        lessonId={selectedId}
        mode="review"
        onBack={() => setSelectedId(null)}
        onNextReview={
          lessons?.some((l) => {
            if (l.id === selectedId) return false;
            const p = getLesson(l.id);
            return (
              p &&
              p.completed &&
              !p.retired &&
              p.nextReview != null &&
              p.nextReview <= getToday()
            );
          })
            ? () => {
                const next = lessons!.find((l) => {
                  if (l.id === selectedId) return false;
                  const p = getLesson(l.id);
                  return (
                    p &&
                    p.completed &&
                    !p.retired &&
                    p.nextReview != null &&
                    p.nextReview <= getToday()
                  );
                });
                setSelectedId(next?.id ?? null);
              }
            : undefined
        }
      />
    );
  }

  if (isLoading || !lessons) {
    return null;
  }

  const today = getToday();
  const ready: { id: number; translation: string; level: number }[] = [];
  const comingUp: {
    id: number;
    translation: string;
    daysLeft: number;
    level: number;
  }[] = [];
  const problematic: { id: number; translation: string; level: number }[] = [];
  let hasLockedReviews = false;

  console.log("[Reviews] today =", today, "pausedAt =", pausedAt);
  lessons.forEach((lesson) => {
    const p = getLesson(lesson.id);
    if (!p || !p.completed || p.retired) return;

    if (!isPremium && !lesson.isFree) {
      hasLockedReviews = true;
      return;
    }
    const level = getMasteryLevel(p);
    const passCount = p.reviewPassCount ?? 0;
    const failCount = p.reviewFailCount ?? 0;
    const consec = p.consecutiveFails ?? 0;
    const isProblematic =
      consec >= 2 || (failCount > passCount && passCount + failCount >= 3);

    console.log(
      "[Reviews] lesson",
      lesson.id,
      "nextReview =",
      JSON.stringify(p.nextReview),
      "typeof",
      typeof p.nextReview,
      "cmp <= today:",
      p.nextReview != null && p.nextReview <= today,
      "isProblematic:",
      isProblematic
    );

    if (isProblematic) {
      problematic.push({
        id: lesson.id,
        translation: lesson.translation,
        level,
      });
    } else if (p.nextReview && !pausedAt && p.nextReview <= today) {
      ready.push({ id: lesson.id, translation: lesson.translation, level });
    } else if (p.nextReview) {
      const nextReviewKey = String(p.nextReview).slice(0, 10);
      const todayDate = new Date(today + "T00:00:00");
      const reviewDate = new Date(nextReviewKey + "T00:00:00");
      const diff = reviewDate.getTime() - todayDate.getTime();
      if (!Number.isFinite(diff)) return;
      const daysLeft = Math.round(diff / (24 * 60 * 60 * 1000));
      comingUp.push({
        id: lesson.id,
        translation: lesson.translation,
        daysLeft: Math.max(1, daysLeft),
        level,
      });
    }
  });

  comingUp.sort((a, b) => a.daysLeft - b.daysLeft);

  const settingsLesson = settingsId !== null ? getLesson(settingsId) : null;

  return (
    <div className={styles.container}>
      <section>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Ready for review</h2>
          <span className={styles.countBadge}>{ready.length}</span>
        </div>
        {ready.length > 0 && (
          <div className={styles.list}>
            {ready.map(({ id, translation, level }) => (
              <div key={id} className={`${styles.item} ${styles.ready}`}>
                <button
                  className={styles.itemBtn}
                  onClick={() => setSelectedId(id)}
                >
                  <span className={`${styles.number} ${styles.numberReady}`}>
                    <FontAwesomeIcon icon={faSparkles} />
                  </span>
                  <div className={styles.itemContent}>
                    <p className={styles.sentence}>{translation}</p>
                  </div>
                </button>
                <CardFooter
                  level={level}
                  onInfoClick={() => setSettingsId(id)}
                  infoAriaLabel="Lesson info and stats"
                />
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
              <div key={id} className={`${styles.item} ${styles.problematic}`}>
                <button
                  className={styles.itemBtn}
                  onClick={() => setRelearningId(id)}
                >
                  <span
                    className={`${styles.number} ${styles.numberProblematic}`}
                  >
                    <FontAwesomeIcon icon={faTriangleExclamation} />
                  </span>
                  <div className={styles.itemContent}>
                    <p className={styles.sentence}>{translation}</p>
                  </div>
                </button>
                <CardFooter
                  level={level}
                  tag="Go back to learn"
                  onInfoClick={() => setSettingsId(id)}
                  infoAriaLabel="Lesson info and stats"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Coming Up</h2>
          <span className={styles.countBadge}>{comingUp.length}</span>
        </div>
        {comingUp.length > 0 && (
          <div className={styles.list}>
            {comingUp.map(({ id, translation, daysLeft, level }) => (
              <div key={id} className={`${styles.item} ${styles.comingUp}`}>
                <button
                  className={styles.itemBtn}
                  onClick={() => {
                    toast.dismiss();
                    toast.error(
                      pausedAt
                        ? "Reviews are paused"
                        : `Not ready yet! Review in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`
                    );
                  }}
                >
                  <span className={`${styles.number} ${styles.numberComingUp}`}>
                    <FontAwesomeIcon icon={faClock} />
                  </span>
                  <div className={styles.itemContent}>
                    <p className={styles.sentence}>{translation}</p>
                  </div>
                </button>
                <CardFooter
                  level={level}
                  tag={
                    pausedAt
                      ? "Paused"
                      : `Review in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`
                  }
                  onInfoClick={() => setSettingsId(id)}
                  infoAriaLabel="Lesson info and stats"
                />
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

      <div className={styles.infoBox}>
        <div className={styles.infoBoxHeader}>
          <FontAwesomeIcon
            icon={faCircleQuestion}
            className={styles.infoBoxIcon}
          />
          <span className={styles.infoBoxTitle}>How reviews work</span>
        </div>
        <p className={styles.infoBoxText}>
          Reviews use spaced repetition to help you remember what you{"\u2019"}
          ve learned. After completing a lesson, it moves here for review.
        </p>
        <p className={styles.infoBoxText}>
          Each time you pass a review, the interval before the next one doubles.
          If you fail, you{"\u2019"}ll go back to practice before trying again.
        </p>
        <p className={styles.infoBoxText}>
          Over time, the intervals grow longer until the sentence is fully
          mastered and retired.
        </p>
      </div>

      <AnimatePresence>
        {settingsId !== null && settingsLesson && (
          <LessonSettings
            lessonProgress={settingsLesson}
            onUnretire={() => {
              unretire(settingsId);
              setSettingsId(null);
            }}
            onReset={() => {
              resetLesson(settingsId);
              setSettingsId(null);
            }}
            onClose={() => setSettingsId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
