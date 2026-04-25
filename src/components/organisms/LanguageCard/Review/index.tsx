"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import RecordButton from "@atoms/RecordButton";
import SentenceDisplay from "@/components/organisms/LanguageCard/SentenceDisplay";
import CorrectionDisplay from "@/components/atoms/CorrectionDisplay";
import WritingInput from "@/components/organisms/LanguageCard/WritingInput";
import FeedbackAlert from "@atoms/FeedbackAlert";
import Button from "@atoms/Button";
import useWritingCheck from "@/components/organisms/LanguageCard/hooks/useWritingCheck";
import useSpeakingCheck from "@/components/organisms/LanguageCard/hooks/useSpeakingCheck";
import Hearts from "@/components/atoms/Hearts";
import { ILesson } from "@lib/types";
import { fadeTransition, fadeVariants } from "@lib/motionVariants";
import styles from "./Review.module.css";

const MAX_ATTEMPTS = 3;

interface Props {
  lesson: ILesson;
  locale: string;
  languageLabel: string;
  onPass: () => void;
  onFail: () => void;
  onViewLesson: () => void;
}

type TReviewStep = "writing" | "speaking";

export default function Review({
  lesson,
  locale,
  languageLabel,
  onPass,
  onFail,
  onViewLesson,
}: Props) {
  const [step, setStep] = useState<TReviewStep>("writing");
  const [attempts, setAttempts] = useState(0);
  const [passed, setPassed] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [showFailedScreen, setShowFailedScreen] = useState(false);

  const writing = useWritingCheck();

  const speaking = useSpeakingCheck(
    locale,
    lesson.id,
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
        setTimeout(() => {
          onFail();
          setShowFailedScreen(true);
        }, 1500);
      }
    }
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

  useEffect(
    function listenForDevPass() {
      if (process.env.NODE_ENV !== "development") return;
      function handlePassWriting() {
        if (step !== "writing") return;
        setLastCorrect(true);
        setPassed(true);
      }
      function handlePassSpeaking() {
        if (step !== "speaking") return;
        setLastCorrect(true);
        setPassed(true);
        onPass();
      }
      window.addEventListener("dev:pass-writing", handlePassWriting);
      window.addEventListener("dev:pass-speaking", handlePassSpeaking);
      return () => {
        window.removeEventListener("dev:pass-writing", handlePassWriting);
        window.removeEventListener("dev:pass-speaking", handlePassSpeaking);
      };
    },
    [step, onPass]
  );

  function handleWriteSubmit(input: string): boolean {
    const { passed: correct, onlyAccentIssues } = writing.check(
      lesson.sentence,
      input
    );
    setLastCorrect(correct);

    if (correct) {
      setPassed(true);
    } else if (!onlyAccentIssues) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= MAX_ATTEMPTS) {
        setTimeout(() => {
          onFail();
          setShowFailedScreen(true);
        }, 1500);
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

  if (showFailedScreen) {
    const corrections =
      step === "writing" ? writing.result : speaking.result?.words;

    return (
      <div className={styles.body}>
        <SentenceDisplay lesson={lesson} />

        <div className={styles.failedSection}>
          <p className={styles.failedTitle}>Oh no, you didn't pass!</p>

          {corrections && corrections.length > 0 && (
            <div>
              <p className={styles.failedLabel}>Here's what you did wrong:</p>
              <CorrectionDisplay words={corrections} />
            </div>
          )}

          <p className={styles.failedHint}>
            Go back to the lesson to brush up.
          </p>
          <Button onClick={onViewLesson}>View Lesson</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.body}>
      <div className={styles.translationWrap}>
        <p className={styles.translation}>
          {"\u201C" + lesson.translation + "\u201D"}
        </p>
        <p className={styles.hint}>
          {step === "writing"
            ? `You have three attempts to write it correctly in ${languageLabel}`
            : `You have three attempts to say it correctly in ${languageLabel}`}
        </p>
      </div>

      <div className={styles.streakWrap}>
        <Hearts total={MAX_ATTEMPTS} remaining={attemptsLeft} />
      </div>

      <AnimatePresence mode="wait">
        {step === "writing" && !writingDone && !failed && (
          <motion.div
            key="writing"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={fadeTransition}
          >
            <WritingInput
              onSubmit={handleWriteSubmit}
              onInputChange={() => {
                if (lastCorrect !== null) setLastCorrect(null);
                if (writing.result !== null) writing.clear();
              }}
              onlyAccentIssues={writing.onlyAccentIssues}
              hideCorrectionsOnAccentHint
            />
          </motion.div>
        )}

        {step === "speaking" && !speakingDone && !failed && (
          <motion.div
            key="speaking"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={fadeTransition}
          >
            <RecordButton
              isListening={speaking.isListening}
              isProcessing={speaking.isProcessing}
              error={speaking.error}
              onToggle={handleRecordToggle}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {lastCorrect !== null &&
        !speaking.isProcessing &&
        !writing.onlyAccentIssues && (
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
