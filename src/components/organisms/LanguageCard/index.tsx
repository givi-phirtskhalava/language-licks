"use client";

import { useCallback, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faXmark } from "@fortawesome/free-solid-svg-icons";
import LessonPhase from "./Lesson";
import WritingPractice from "./WritingPractice";
import SpeakingPractice from "./SpeakingPractice";
import Review from "./Review";
import Complete from "./Complete";
import { getLessons } from "@lib/lessons";
import { TPhase } from "@lib/types";
import useLanguage from "@lib/useLanguage";
import { LANGUAGES } from "@lib/projectConfig";
import useProgress from "@lib/useProgress";
import styles from "./LanguageCard.module.css";

interface Props {
  lessonIndex: number;
  onBack: () => void;
  mode?: "lesson" | "review";
}

export default function LanguageCard({ lessonIndex, onBack, mode = "lesson" }: Props) {
  const { language } = useLanguage();
  const { getLesson, updatePhase } = useProgress(language);
  const lessons = getLessons(language);
  const saved = getLesson(lessonIndex);
  const savedPhase =
    saved?.phase === "practice" ? "practice-writing" : saved?.phase;

  function getInitialPhase(): TPhase {
    if (mode === "review") return "review";
    if (saved?.completed) return "lesson";
    return savedPhase ?? "lesson";
  }

  const [phase, setPhase] = useState<TPhase>(getInitialPhase);

  const langConfig = LANGUAGES.find((l) => l.id === language);
  const locale = langConfig?.locale ?? "fr-FR";
  const lesson = lessons[lessonIndex];

  function changePhase(next: TPhase, isReview = false) {
    setPhase(next);
    updatePhase(lessonIndex, next, isReview);
  }

  const handleTestPass = useCallback(() => {
    changePhase("complete", mode === "review");
  }, [mode]);

  const handleTestFail = useCallback(() => {
    changePhase("practice-writing");
  }, []);

  const phases: TPhase[] = [
    "lesson",
    "practice-writing",
    "practice-speaking",
    "test",
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

  const isFirstPhase = phase === "lesson";
  const isLastPhase = phases.indexOf(phase) >= phases.length - 1;
  const isTest = phase === "test";
  const showBack = mode !== "review" && !isFirstPhase;
  const showNext = mode !== "review" && !isLastPhase && !isTest;

  const phaseLabel =
    phase === "lesson"
      ? "Study"
      : phase === "practice-writing"
        ? "Writing Practice"
        : phase === "practice-speaking"
          ? "Speaking Practice"
          : phase === "test"
            ? "Test"
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

        {phase === "lesson" && (
          <LessonPhase
            lesson={lesson}
            onReady={() => changePhase("practice-writing")}
          />
        )}
        {phase === "practice-writing" && (
          <WritingPractice
            lesson={lesson}
            onReady={() => changePhase("practice-speaking")}
          />
        )}
        {phase === "practice-speaking" && (
          <SpeakingPractice
            lesson={lesson}
            locale={locale}
            onReady={() => {
              if (mode === "lesson" && saved?.completed) {
                onBack();
              } else {
                changePhase("test");
              }
            }}
          />
        )}
        {(phase === "test" || phase === "review") && (
          <Review
            lesson={lesson}
            locale={locale}
            languageLabel={langConfig?.label ?? "French"}
            onPass={handleTestPass}
            onFail={handleTestFail}
          />
        )}
        {phase === "complete" && <Complete lesson={lesson} onNext={onBack} />}
      </div>

    </div>
  );
}
