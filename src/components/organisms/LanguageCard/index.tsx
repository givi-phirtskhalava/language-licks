"use client";

import { useCallback, useState } from "react";
import { Toaster } from "react-hot-toast";
import LessonPhase from "./Lesson";
import WritingPractice from "./WritingPractice";
import SpeakingPractice from "./SpeakingPractice";
import Test from "./Test";
import Complete from "./Complete";
import { LESSONS } from "@lib/lessons";
import { TPhase } from "@lib/types";
import useProgress from "@lib/useProgress";
import styles from "./LanguageCard.module.css";

interface Props {
  lessonIndex: number;
  onBack: () => void;
}

export default function LanguageCard({ lessonIndex, onBack }: Props) {
  const { getLesson, updatePhase } = useProgress();
  const saved = getLesson(lessonIndex);
  const savedPhase = saved?.phase === "practice" ? "practice-writing" : saved?.phase;
  const initialPhase: TPhase = saved?.completed ? "lesson" : (savedPhase ?? "lesson");
  const [phase, setPhase] = useState<TPhase>(initialPhase);

  const lesson = LESSONS[lessonIndex];

  function changePhase(next: TPhase) {
    setPhase(next);
    updatePhase(lessonIndex, next);
  }

  const handleTestPass = useCallback(() => {
    changePhase("complete");
  }, []);

  const handleTestFail = useCallback(() => {
    changePhase("practice-writing");
  }, []);

  const phaseLabel =
    phase === "lesson"
      ? "Study"
      : phase === "practice-writing"
        ? "Writing Practice"
        : phase === "practice-speaking"
          ? "Speaking Practice"
          : phase === "test"
            ? "Test"
            : "Complete";

  return (
    <>
      <Toaster position="top-center" />
      <div className={styles.card}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={onBack}>
            {"< Back"}
          </button>
          <p className={styles.headerTitle}>{phaseLabel}</p>
        </div>

        {phase === "lesson" && (
          <LessonPhase lesson={lesson} onReady={() => changePhase("practice-writing")} />
        )}
        {phase === "practice-writing" && (
          <WritingPractice lesson={lesson} onReady={() => changePhase("practice-speaking")} />
        )}
        {phase === "practice-speaking" && (
          <SpeakingPractice lesson={lesson} onReady={() => changePhase("test")} />
        )}
        {phase === "test" && (
          <Test
            lesson={lesson}
            onPass={handleTestPass}
            onFail={handleTestFail}
          />
        )}
        {phase === "complete" && (
          <Complete lesson={lesson} onNext={onBack} />
        )}
      </div>
    </>
  );
}
