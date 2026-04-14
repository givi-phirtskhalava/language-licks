"use client";

import { useEffect, useState } from "react";
import RecordButton from "@/components/organisms/LanguageCard/RecordButton";
import WritingInput from "@/components/organisms/LanguageCard/WritingInput";
import FeedbackAlert from "@atoms/FeedbackAlert";
import useWritingCheck from "@/components/organisms/LanguageCard/hooks/useWritingCheck";
import useSpeakingCheck from "@/components/organisms/LanguageCard/hooks/useSpeakingCheck";
import Hearts from "@/components/atoms/Hearts";
import { ILesson } from "@lib/types";
import styles from "./Review.module.css";

const MAX_ATTEMPTS = 3;

interface Props {
  lesson: ILesson;
  locale: string;
  languageLabel: string;
  onPass: () => void;
  onFail: () => void;
}

type TReviewStep = "writing" | "speaking";

export default function Review({ lesson, locale, languageLabel, onPass, onFail }: Props) {
  const [step, setStep] = useState<TReviewStep>("writing");
  const [attempts, setAttempts] = useState(0);
  const [passed, setPassed] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  const writing = useWritingCheck();

  const speaking = useSpeakingCheck(
    locale,
    lesson.sentence,
    () => {
      setLastCorrect(true);
      setPassed(true);
      setTimeout(onPass, 1200);
    },
    () => {
      setLastCorrect(false);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= MAX_ATTEMPTS) {
        setTimeout(onFail, 1500);
      }
    },
    "testing",
  );

  useEffect(() => {
    if (step === "writing" && passed) {
      const timer = setTimeout(() => {
        setStep("speaking");
        setPassed(false);
        setAttempts(0);
        setLastCorrect(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [step, passed]);

  function handleWriteSubmit(input: string): boolean {
    const { passed: correct, onlyAccentIssues } = writing.check(
      lesson.sentence,
      input,
    );
    setLastCorrect(correct);

    if (correct) {
      setPassed(true);
    } else if (!onlyAccentIssues) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= MAX_ATTEMPTS) {
        setTimeout(onFail, 1500);
      }
    }

    return onlyAccentIssues;
  }

  function handleRecordToggle() {
    setLastCorrect(null);
    speaking.toggle();
  }

  const attemptsLeft = MAX_ATTEMPTS - attempts;
  const writingDone = step === "writing" && passed;
  const speakingDone = step === "speaking" && passed;
  const failed = attempts >= MAX_ATTEMPTS && !passed;

  return (
    <div className={styles.body}>
      <div className={styles.translationWrap}>
        <p className={styles.translation}>
          {"\u201C" + lesson.translation + "\u201D"}
        </p>
        <p className={styles.hint}>
          {step === "writing" ? `Write it in ${languageLabel}!` : `Say it in ${languageLabel}!`}
        </p>
      </div>

      <div className={styles.streakWrap}>
        <Hearts total={MAX_ATTEMPTS} remaining={attemptsLeft} />
      </div>

      {step === "writing" && !writingDone && !failed && (
        <div>
          <p className={styles.sectionLabel}>Write the sentence</p>
          <WritingInput
            onSubmit={handleWriteSubmit}
            onInputChange={() => {
              if (lastCorrect !== null) setLastCorrect(null);
              if (writing.result !== null) writing.clear();
            }}
            onlyAccentIssues={writing.onlyAccentIssues}
            hideCorrectionsOnAccentHint
          />
        </div>
      )}

      {step === "speaking" && !speakingDone && !failed && (
        <div>
          <p className={styles.sectionLabel}>Say the sentence</p>
          <RecordButton
            isListening={speaking.isListening}
            isProcessing={speaking.isProcessing}
            error={speaking.error}
            onToggle={handleRecordToggle}
            showHint={lastCorrect === null}
          />
        </div>
      )}

      {lastCorrect !== null && !speaking.isProcessing && !writing.onlyAccentIssues && (
        <FeedbackAlert theme={lastCorrect ? "correct" : "wrong"}>
          {lastCorrect
            ? step === "writing"
              ? "Correct! Moving to speaking\u2026"
              : "Correct!"
            : failed
              ? "Back to practice\u2026"
              : "Not quite \u2014 try again"}
        </FeedbackAlert>
      )}

    </div>
  );
}
