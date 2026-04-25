"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import LessonPhase from "./Lesson";
import WritingPractice from "./WritingPractice";
import SpeakingPractice from "./SpeakingPractice";
import Review from "./Review";
import Complete from "./Complete";
import Spinner from "@atoms/Spinner";
import useLesson, { LessonFetchError } from "@lib/hooks/useLesson";
import useAuth from "@lib/hooks/useAuth";
import { TPhase } from "@lib/types";
import useLanguage from "@lib/useLanguage";
import { LANGUAGES } from "@lib/projectConfig";
import useProgress from "@lib/useProgress";
import { fadeTransition, fadeVariants } from "@lib/motionVariants";
import styles from "./LanguageCard.module.css";

interface Props {
  lessonId: number;
  onBack: () => void;
  mode?: "lesson" | "review";
  onNextReview?: () => void;
}

export default function LanguageCard({
  lessonId,
  onBack,
  mode = "lesson",
  onNextReview,
}: Props) {
  const { language } = useLanguage();
  const router = useRouter();
  const { isPremium } = useAuth();
  const {
    getLesson,
    updatePhase,
    failReview,
    unlockSpeaking,
    markLessonLearned,
  } = useProgress(language);
  const { data: lesson, isLoading, error } = useLesson(lessonId);
  const isAccessible = !!lesson && (lesson.isFree || isPremium);
  const isForbidden =
    error instanceof LessonFetchError &&
    (error.status === 401 || error.status === 403);

  useEffect(() => {
    if (mode === "review") return;
    if (isForbidden || (lesson && !isAccessible)) {
      router.replace("/premium");
    }
  }, [lesson, isAccessible, isForbidden, mode, router]);
  const saved = getLesson(lessonId);
  const savedPhase =
    saved?.phase === "practice" || saved?.phase === "test"
      ? "practice-writing"
      : saved?.phase;

  function getInitialPhase(): TPhase {
    if (mode === "review") return "review";
    if (saved?.completed) return "lesson";
    return savedPhase ?? "lesson";
  }

  const [phase, setPhase] = useState<TPhase>(getInitialPhase);

  const langConfig = LANGUAGES.find((l) => l.id === language);
  const locale = langConfig?.locale ?? "fr-FR";

  function changePhase(next: TPhase, isReview = false) {
    setPhase(next);
    updatePhase(lessonId, next, isReview);
    window.scrollTo(0, 0);
  }

  const handleReviewPass = useCallback(() => {
    changePhase("complete", true);
  }, []);

  const handleReviewFail = useCallback(() => {
    failReview(lessonId);
  }, [lessonId, failReview]);

  const handleViewLesson = useCallback(() => {
    router.push(`/lessons/${language}/${lessonId}`);
  }, [lessonId, language, router]);

  const phases: TPhase[] = [
    "lesson",
    "practice-writing",
    "practice-speaking",
    "complete",
  ];

  function handleBack() {
    if (mode === "review") {
      onBack();
      return;
    }
    const currentIndex = phases.indexOf(phase);
    if (currentIndex <= 0) {
      onBack();
      return;
    }
    changePhase(phases[currentIndex - 1]);
  }

  function handleNext() {
    const currentIndex = phases.indexOf(phase);
    if (currentIndex < phases.length - 1) {
      changePhase(phases[currentIndex + 1]);
    }
  }

  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <div className={styles.loading}>
            <Spinner color="var(--accent)" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !isForbidden) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <div className={styles.loading}>
            <p>Something went wrong. Please check back later.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return null;
  }

  const isFirstTime = !saved?.completed;
  const isFirstPhase = phase === "lesson";
  const isLastPhase = phases.indexOf(phase) >= phases.length - 1;
  const phaseGated =
    isFirstTime &&
    ((phase === "practice-writing" && !saved?.speakingUnlocked) ||
      (phase === "practice-speaking" && !saved?.lessonLearned));
  const showBack = mode !== "review" && !isFirstPhase && isAccessible;
  const showNext =
    mode !== "review" && !isLastPhase && isAccessible && !phaseGated;

  const phaseLabel =
    phase === "lesson"
      ? "Study"
      : phase === "practice-writing"
        ? "Writing Practice"
        : phase === "practice-speaking"
          ? "Speaking Practice"
          : phase === "review"
            ? "Review"
            : "Complete";

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          {showBack && (
            <button className={styles.circleBtn} onClick={handleBack}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
          )}
          {!showBack && mode !== "review" && (
            <span className={styles.circlePlaceholder} />
          )}
          {mode === "review" && <span className={styles.circlePlaceholder} />}

          <p className={styles.headerTitle}>{phaseLabel}</p>

          {mode === "review" && (
            <button className={styles.circleBtn} onClick={onBack}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
          {showNext && (
            <button className={styles.circleBtn} onClick={handleNext}>
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          )}
          {!showNext && mode !== "review" && (
            <span className={styles.circlePlaceholder} />
          )}
        </div>

        <AnimatePresence mode="wait">
          {isAccessible && phase === "lesson" && (
            <motion.div
              key="lesson"
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={fadeTransition}
            >
              <LessonPhase
                lesson={lesson}
                onReady={() => changePhase("practice-writing")}
              />
            </motion.div>
          )}

          {isAccessible && phase === "practice-writing" && (
            <motion.div
              key="practice-writing"
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={fadeTransition}
            >
              <WritingPractice
                lesson={lesson}
                languageLabel={langConfig?.label ?? "French"}
                isFirstTime={isFirstTime}
                onReady={() => changePhase("practice-speaking")}
                initialSpeakingUnlocked={saved?.speakingUnlocked ?? false}
                onSpeakingUnlocked={() => unlockSpeaking(lessonId)}
              />
            </motion.div>
          )}

          {isAccessible && phase === "practice-speaking" && (
            <motion.div
              key="practice-speaking"
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={fadeTransition}
            >
              <SpeakingPractice
                lesson={lesson}
                locale={locale}
                languageLabel={langConfig?.label ?? "French"}
                isFirstTime={isFirstTime}
                onReady={() => {
                  if (mode === "lesson" && saved?.completed) {
                    onBack();
                  } else {
                    changePhase("complete");
                  }
                }}
                initialLessonLearned={saved?.lessonLearned ?? false}
                onLessonLearned={() => markLessonLearned(lessonId)}
              />
            </motion.div>
          )}

          {isAccessible && phase === "review" && (
            <motion.div
              key="review"
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={fadeTransition}
            >
              <Review
                lesson={lesson}
                locale={locale}
                languageLabel={langConfig?.label ?? "French"}
                onPass={handleReviewPass}
                onFail={handleReviewFail}
                onViewLesson={handleViewLesson}
              />
            </motion.div>
          )}

          {phase === "complete" && (
            <motion.div
              key="complete"
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={fadeTransition}
            >
              <Complete
                lesson={lesson}
                mode={mode}
                onNext={onBack}
                onPractice={mode === "lesson" ? () => changePhase("lesson") : undefined}
                onNextReview={onNextReview}
                nextReview={saved?.nextReview}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
