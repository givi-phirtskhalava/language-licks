"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import SentenceDisplay from "@/components/organisms/LanguageCard/SentenceDisplay";
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
  onReady: () => void;
  initialStreak?: number;
  initialBestTime?: number | null;
  onStreakChange?: (streak: number) => void;
  onBestTimeChange?: (time: number) => void;
}

export default function WritingPractice({
  lesson,
  onReady,
  initialStreak = 0,
  initialBestTime = null,
  onStreakChange,
  onBestTimeChange,
}: Props) {
  const [textVisible, setTextVisible] = useState(false);
  const writeStreak = useStreak({
    readyMessage:
      "I think you\u2019re ready for the speaking test! \uD83C\uDF99\uFE0F",
    initialStreak,
    onStreakChange,
  });
  const writeTimer = useBestTime({ initialBestTime, onBestTimeChange });
  const writing = useWritingCheck();

  function handleWriteSubmit(input: string) {
    const { passed } = writing.check(lesson.sentence, input);
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
      <SentenceDisplay
        lesson={lesson}
        blurrable
        onRevealChange={(visible) => {
          setTextVisible(visible);
          if (visible) writeStreak.miss();
        }}
      />

      <div>
        <SectionHeader
          label="Writing Practice"
          bestTime={writeTimer.bestTime}
          streak={writeStreak.streak}
          streakGoal={writeStreak.goal}
        />

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
          disabled={textVisible}
        >
          {writing.result !== null && writing.isPass && (
            <FeedbackAlert theme="correct">
              <span>Correct!</span>
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

      <Button onClick={onReady}>
        Speaking Practice
        <FontAwesomeIcon
          icon={faChevronRight}
          style={{ marginLeft: "0.5em" }}
        />
      </Button>
    </div>
  );
}
