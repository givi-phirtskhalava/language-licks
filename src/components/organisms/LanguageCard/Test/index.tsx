"use client";

import { useEffect, useState } from "react";
import WordResult from "@/components/organisms/LanguageCard/WordResult";
import RecordButton from "@/components/organisms/LanguageCard/RecordButton";
import WritingInput from "@/components/organisms/LanguageCard/WritingInput";
import useWritingCheck from "@/components/organisms/LanguageCard/hooks/useWritingCheck";
import useSpeakingCheck from "@/components/organisms/LanguageCard/hooks/useSpeakingCheck";
import { ILesson } from "@lib/types";
import styles from "./Test.module.css";

const MAX_ATTEMPTS = 3;

interface Props {
  lesson: ILesson;
  onPass: () => void;
  onFail: () => void;
}

type TTestStep = "writing" | "speaking";

export default function Test({ lesson, onPass, onFail }: Props) {
  const [step, setStep] = useState<TTestStep>("writing");
  const [attempts, setAttempts] = useState(0);
  const [passed, setPassed] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  const writing = useWritingCheck();

  const speaking = useSpeakingCheck(
    "fr-FR",
    lesson.sentence,
    () => {
      setLastCorrect(true);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
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
  );

  // Auto-advance from writing to speaking on pass
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

  function handleWriteSubmit(input: string) {
    const correct = writing.check(lesson.sentence, input);
    setLastCorrect(correct);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (correct) {
      setPassed(true);
    } else if (newAttempts >= MAX_ATTEMPTS) {
      setTimeout(onFail, 1500);
    }
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
      {/* Sentence — always blurred */}
      <div className={styles.sentenceWrap}>
        <p className={`${styles.sentence} ${styles.sentenceBlurred}`}>
          {lesson.sentence}
        </p>
        <p className={styles.memoryHint}>
          {step === "writing" ? "Write it from memory!" : "Say it from memory!"}
        </p>
      </div>

      {/* Attempts remaining */}
      <div className={styles.streakWrap}>
        <p className={styles.streakLabel}>
          {failed
            ? "No attempts remaining"
            : attemptsLeft +
              " attempt" +
              (attemptsLeft !== 1 ? "s" : "") +
              " remaining"}
        </p>
      </div>

      {/* Writing test */}
      {step === "writing" && !writingDone && !failed && (
        <div>
          <p className={styles.sectionLabel}>Write the sentence</p>
          <WritingInput
            onSubmit={handleWriteSubmit}
            onInputChange={() => {
              if (lastCorrect !== null) setLastCorrect(null);
            }}
          />
        </div>
      )}

      {/* Speaking test */}
      {step === "speaking" && !speakingDone && !failed && (
        <div>
          <p className={styles.sectionLabel}>Say the sentence</p>
          <RecordButton
            isListening={speaking.isListening}
            isProcessing={speaking.isProcessing}
            isSupported={speaking.isSupported}
            error={speaking.error}
            onToggle={handleRecordToggle}
            showHint={lastCorrect === null}
          />
        </div>
      )}

      {/* Feedback */}
      {lastCorrect !== null && !speaking.isProcessing && (
        <div
          className={`${styles.alert} ${lastCorrect ? styles.feedbackCorrect : styles.feedbackWrong}`}
        >
          {lastCorrect
            ? step === "writing"
              ? "Correct! Moving to speaking\u2026"
              : "Correct!"
            : failed
              ? "Back to practice\u2026"
              : "Not quite \u2014 try again"}
        </div>
      )}

      {/* Wrong words for speaking */}
      {step === "speaking" && speaking.result && !speaking.result.correct && (
        <div className={styles.wordList}>
          {speaking.result.words
            .filter((w) => !w.correct)
            .map((w, i) => (
              <WordResult key={i} word={w} />
            ))}
        </div>
      )}
    </div>
  );
}
