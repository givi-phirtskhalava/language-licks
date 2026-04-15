"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGear,
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
import formatTimeUntil from "@lib/util/formatTimeUntil";
import MasteryBar from "@/components/atoms/MasteryBar";
import LessonSettings from "@/components/atoms/LessonSettings";
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
              p.nextReview <= Date.now()
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
                    p.nextReview <= Date.now()
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

  const settingsLesson = settingsId !== null ? getLesson(settingsId) : null;

  return (
    <div className={styles.container}>
      <section>
        <h2 className={styles.sectionTitle}>Ready for review</h2>
        {ready.length > 0 && (
          <div className={styles.list}>
            {ready.map(({ id, translation, level }) => (
              <button
                key={id}
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
                <button
                  className={styles.gearBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSettingsId(id);
                  }}
                >
                  <FontAwesomeIcon icon={faGear} />
                </button>
              </button>
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
              <button
                key={id}
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
                <button
                  className={styles.gearBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSettingsId(id);
                  }}
                >
                  <FontAwesomeIcon icon={faGear} />
                </button>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className={styles.sectionTitle}>Coming Up</h2>
        {comingUp.length > 0 && (
          <div className={styles.list}>
            {comingUp.map(({ id, translation, timeLeft, level }) => (
              <button
                key={id}
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
                <button
                  className={styles.gearBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSettingsId(id);
                  }}
                >
                  <FontAwesomeIcon icon={faGear} />
                </button>
              </button>
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
          Reviews use spaced repetition to help you remember what you{"\u2019"}ve
          learned. After completing a lesson, it moves here for review.
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
    </div>
  );
}
