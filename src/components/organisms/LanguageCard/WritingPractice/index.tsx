"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import SentenceDisplay from "@/components/organisms/LanguageCard/SentenceDisplay";
import StreakDots from "@/components/organisms/LanguageCard/StreakDots";
import WritingInput from "@/components/organisms/LanguageCard/WritingInput";
import useStreak from "@/components/organisms/LanguageCard/useStreak";
import useBestTime from "@/components/organisms/LanguageCard/useBestTime";
import useWritingCheck from "@/components/organisms/LanguageCard/hooks/useWritingCheck";
import { ILesson } from "@lib/types";
import styles from "./WritingPractice.module.css";

interface Props {
  lesson: ILesson;
  onReady: () => void;
}

export default function WritingPractice({ lesson, onReady }: Props) {
  const writeStreak = useStreak("I think you\u2019re ready for the speaking test! \uD83C\uDF99\uFE0F");
  const writeTimer = useBestTime();
  const writing = useWritingCheck();

  function handleWriteSubmit(input: string) {
    const passed = writing.check(lesson.sentence, input);
    if (passed) {
      writeTimer.stopTimer();
      writeStreak.hit();
    } else {
      writeTimer.resetTimer();
      writeStreak.miss();
    }
  }

  function handleWriteRetry() {
    writing.clear();
    writeTimer.resetTimer();
  }

  function handleWriteInputChange() {
    if (writing.result !== null) writing.clear();
    writeTimer.startTimer();
  }

  return (
    <div className={styles.body}>
      <SentenceDisplay lesson={lesson} blurrable />

      <div>
        <div className={styles.sectionHeader}>
          <p className={styles.sectionLabel}>Writing Practice</p>
          <div className={styles.sectionMeta}>
            <span className={styles.bestTime}>
              Best: {writeTimer.bestTime !== null ? writeTimer.bestTime.toFixed(1) + "s" : "\u2014"}
            </span>
            <StreakDots streak={writeStreak.streak} goal={writeStreak.goal} />
          </div>
        </div>

        <WritingInput
          onSubmit={handleWriteSubmit}
          onInputChange={handleWriteInputChange}
          result={writing.result}
          hasErrors={writing.hasErrors}
          hasWarnings={writing.hasWarnings}
          isPass={writing.isPass}
          onRetry={handleWriteRetry}
        >
          {writing.result !== null && writing.isPass && (
            <div
              className={`${styles.alert} ${styles.feedbackCorrect}`}
              style={{ marginTop: "0.75rem" }}
            >
              <span>Correct!</span>
              {writeTimer.elapsed !== null && (
                <span className={styles.timeInfo}>
                  {writeTimer.elapsed.toFixed(1)}s
                </span>
              )}
              {writeTimer.bestTime !== null && writeTimer.elapsed === writeTimer.bestTime && (
                <span className={styles.newBest}>&nbsp;New best!</span>
              )}
            </div>
          )}
        </WritingInput>
      </div>

      <button onClick={onReady} className={styles.primaryBtn}>
        Speaking Practice
        <FontAwesomeIcon icon={faChevronRight} style={{ marginLeft: "0.5rem" }} />
      </button>
    </div>
  );
}
