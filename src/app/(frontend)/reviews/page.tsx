"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import useLanguage from "@lib/useLanguage";
import useLessons from "@lib/hooks/useLessons";
import useAuth from "@lib/hooks/useAuth";
import useProgress, { getReviewBucket, getToday } from "@lib/useProgress";
import LessonSettings from "@/components/atoms/LessonSettings";
import LessonItem from "@/components/organisms/LessonItem";
import SignUpPrompt from "@atoms/SignUpPrompt";
import LanguageCard from "@/components/organisms/LanguageCard";
import styles from "./Reviews.module.css";

export default function Reviews() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [settingsId, setSettingsId] = useState<number | null>(null);
  const [relearningId, setRelearningId] = useState<number | null>(null);
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
            return (
              getReviewBucket(getLesson(l.id), pausedAt, getToday()) === "ready"
            );
          })
            ? () => {
                const next = lessons!.find((l) => {
                  if (l.id === selectedId) return false;
                  return (
                    getReviewBucket(getLesson(l.id), pausedAt, getToday()) ===
                    "ready"
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
  console.log("[Reviews] today =", today, "pausedAt =", pausedAt);
  const accessible = lessons.filter((l) => isPremium || l.isFree);
  const hasLockedReviews = lessons.some((l) => {
    if (isPremium || l.isFree) return false;
    const p = getLesson(l.id);
    return p && p.completed && !p.retired;
  });

  const buckets = accessible.map((l) => {
    const p = getLesson(l.id);
    const bucket = getReviewBucket(p, pausedAt, today);
    console.log(
      "[Reviews] lesson",
      l.id,
      "nextReview =",
      JSON.stringify(p?.nextReview),
      "typeof",
      typeof p?.nextReview,
      "bucket:",
      bucket
    );
    return { lesson: l, bucket };
  });

  const ready = buckets
    .filter((b) => b.bucket === "ready")
    .map((b) => b.lesson);

  const problematic = buckets
    .filter((b) => b.bucket === "problematic")
    .map((b) => b.lesson);

  const comingUp = buckets
    .filter((b) => b.bucket === "comingUp")
    .map((b) => b.lesson)
    .sort((a, b) => {
      const aNext = getLesson(a.id)?.nextReview ?? "";
      const bNext = getLesson(b.id)?.nextReview ?? "";
      return aNext.localeCompare(bNext);
    });

  const settingsLesson = settingsId !== null ? getLesson(settingsId) : null;

  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Ready for review</h2>
          <span className={styles.countBadge}>{ready.length}</span>
        </div>

        {ready.length > 0 && (
          <div className={styles.list}>
            {ready.map((lesson) => (
              <LessonItem
                key={lesson.id}
                type="review"
                lesson={lesson}
                onClick={() => setSelectedId(lesson.id)}
                onSettingsClick={() => setSettingsId(lesson.id)}
              />
            ))}
          </div>
        )}

        {ready.length === 0 && (
          <p className={styles.emptyText}>Nothing to review yet...</p>
        )}
      </section>

      {problematic.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Needs Attention</h2>
          <div className={styles.list}>
            {problematic.map((lesson) => (
              <LessonItem
                key={lesson.id}
                type="review"
                lesson={lesson}
                onClick={() => setRelearningId(lesson.id)}
                onSettingsClick={() => setSettingsId(lesson.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Coming Up</h2>
          <span className={styles.countBadge}>{comingUp.length}</span>
        </div>
        {comingUp.length > 0 && (
          <div className={styles.list}>
            {comingUp.map((lesson) => (
              <LessonItem
                key={lesson.id}
                type="review"
                lesson={lesson}
                onClick={() => {}}
                onSettingsClick={() => setSettingsId(lesson.id)}
              />
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
          Reviews use spaced repetition to help you remember what you{"’"}
          ve learned. After completing a lesson, it moves here for review.
        </p>
        <p className={styles.infoBoxText}>
          Each time you pass a review, the interval before the next one doubles.
          If you fail, you{"’"}ll go back to practice before trying again.
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
