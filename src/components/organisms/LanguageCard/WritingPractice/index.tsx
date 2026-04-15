"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import SectionHeader from "@/components/atoms/SectionHeader";
import FeedbackAlert from "@atoms/FeedbackAlert";
import Button from "@atoms/Button";
import WritingInput from "@/components/organisms/LanguageCard/WritingInput";
import useStreak from "@/components/organisms/LanguageCard/useStreak";
import useBestTime from "@/components/organisms/LanguageCard/useBestTime";
import useWritingCheck from "@/components/organisms/LanguageCard/hooks/useWritingCheck";
import { ILesson } from "@lib/types";
import styles from "./WritingPractice.module.css";

interface Props {
  lesson: ILesson;
  languageLabel: string;
  onReady: () => void;
  isFirstTime?: boolean;
  initialStreak?: number;
  initialBestTime?: number | null;
  onStreakChange?: (streak: number) => void;
  onBestTimeChange?: (time: number) => void;
}

export default function WritingPractice({
  lesson,
  languageLabel,
  onReady,
  isFirstTime = false,
  initialStreak = 0,
  initialBestTime = null,
  onStreakChange,
  onBestTimeChange,
}: Props) {
  const writeStreak = useStreak({ initialStreak, onStreakChange });
  const writeTimer = useBestTime({ initialBestTime, onBestTimeChange });
  const writing = useWritingCheck();

  function handleWriteSubmit(input: string) {
    const { passed, onlyAccentIssues } = writing.check(lesson.sentence, input);
    if (passed) {
      writeTimer.stopTimer();
      writeStreak.hit();
    } else {
      writeTimer.resetTimer();
      writeStreak.miss();
    }
    return onlyAccentIssues;
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
      <div className={styles.translationWrap}>
        <p className={styles.translation}>
          {"\u201C" + lesson.translation + "\u201D"}
        </p>
        <p className={styles.hint}>
          {isFirstTime
            ? `Write it correctly in ${languageLabel} three times!`
            : `Write it in ${languageLabel}!`}
        </p>
      </div>

      <div>
        <WritingInput
          onSubmit={handleWriteSubmit}
          onInputChange={handleWriteInputChange}
          result={writing.result}
          hasErrors={writing.hasErrors}
          hasWarnings={writing.hasWarnings}
          isPass={writing.isPass}
          onlyAccentIssues={writing.onlyAccentIssues}
          hideCorrectionsOnAccentHint
          onRetry={handleWriteRetry}
        >
          {writing.result !== null && writing.isPass && (
            <FeedbackAlert theme="correct">
              <span>
                Correct!
                {writeStreak.streak === writeStreak.goal &&
                  " You\u2019re ready for the speaking practice."}
              </span>
              {writeTimer.elapsed !== null && (
                <span className={styles.timeInfo}>
                  {writeTimer.elapsed.toFixed(1)}s
                </span>
              )}
              {writeTimer.bestTime !== null &&
                writeTimer.elapsed === writeTimer.bestTime && (
                  <span className={styles.newBest}>&nbsp;New best!</span>
                )}
            </FeedbackAlert>
          )}
        </WritingInput>
      </div>

      {isFirstTime && (
        <SectionHeader
          bestTime={writeTimer.bestTime}
          streak={writeStreak.streak}
          streakGoal={writeStreak.goal}
        />
      )}

      <Button
        onClick={onReady}
        disabled={isFirstTime && writeStreak.streak < writeStreak.goal}
      >
        Speaking Practice
        <FontAwesomeIcon
          icon={faChevronRight}
          style={{ marginLeft: "0.5em" }}
        />
      </Button>
    </div>
  );
}
