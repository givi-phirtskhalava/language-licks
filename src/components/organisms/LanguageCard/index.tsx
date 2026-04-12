"use client";

import { useCallback, useState } from "react";
import { Toaster } from "react-hot-toast";
import LessonPhase from "./Lesson";
import Practice from "./Practice";
import Test from "./Test";
import Complete from "./Complete";
import { LESSONS } from "@lib/lessons";
import styles from "./LanguageCard.module.css";

type Phase = "lesson" | "practice" | "test" | "complete";

export default function LanguageCard() {
  const [lessonIndex, setLessonIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("lesson");

  const lesson = LESSONS[lessonIndex];
  const hasNext = lessonIndex < LESSONS.length - 1;

  const handleTestPass = useCallback(() => {
    setPhase("complete");
  }, []);

  const handleTestFail = useCallback(() => {
    setPhase("practice");
  }, []);

  function handleNext() {
    setLessonIndex((i) => i + 1);
    setPhase("lesson");
  }

  const phaseLabel =
    phase === "lesson"
      ? "Study"
      : phase === "practice"
        ? "Practice"
        : phase === "test"
          ? "Test"
          : "Complete";

  return (
    <>
      <Toaster position="top-center" />
      <div className={styles.card}>
        <div className={styles.header}>
          <p className={styles.headerTitle}>
            {"French \u2014 "}
            {phaseLabel}
          </p>
          <p className={styles.headerCount}>
            {"Lesson "}
            {lessonIndex + 1}
            {"/"}
            {LESSONS.length}
          </p>
        </div>

        {phase === "lesson" && (
          <LessonPhase lesson={lesson} onReady={() => setPhase("practice")} />
        )}
        {phase === "practice" && (
          <Practice lesson={lesson} onReady={() => setPhase("test")} />
        )}
        {phase === "test" && (
          <Test
            lesson={lesson}
            onPass={handleTestPass}
            onFail={handleTestFail}
          />
        )}
        {phase === "complete" && (
          <Complete lesson={lesson} onNext={hasNext ? handleNext : null} />
        )}
      </div>
    </>
  );
}
