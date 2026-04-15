"use client";

import { useState } from "react";
import SentenceDisplay from "@/components/organisms/LanguageCard/SentenceDisplay";
import CorrectionDisplay from "@/components/atoms/CorrectionDisplay";
import FeedbackAlert from "@atoms/FeedbackAlert";
import Button from "@atoms/Button";
import SectionHeader from "@/components/atoms/SectionHeader";
import RecordButton from "@atoms/RecordButton";
import WritingInput from "@/components/organisms/LanguageCard/WritingInput";
import useStreak from "@/components/organisms/LanguageCard/useStreak";
import useBestTime from "@/components/organisms/LanguageCard/useBestTime";
import useWritingCheck from "@/components/organisms/LanguageCard/hooks/useWritingCheck";
import useSpeakingCheck from "@/components/organisms/LanguageCard/hooks/useSpeakingCheck";
import { ILesson } from "@lib/types";
import styles from "./Practice.module.css";

interface Props {
  lesson: ILesson;
  onReady: () => void;
}

export default function Practice({ lesson, onReady }: Props) {
  const [textVisible, setTextVisible] = useState(false);
  const writeStreak = useStreak({});
  const writeTimer = useBestTime();
  const writing = useWritingCheck();

  const speakStreak = useStreak({});
  const speakTimer = useBestTime();
  const speaking = useSpeakingCheck(
    "fr-FR",
    lesson.sentence,
    () => {
      speakTimer.stopTimer();
      speakStreak.hit();
    },
    () => {
      speakTimer.resetTimer();
      speakStreak.miss();
    },
  );

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

  function handleWriteInputChange() {
    if (writing.result !== null) writing.clear();
    writeTimer.startTimer();
  }

  function handleRecordToggle() {
    speakTimer.startTimer();
    speaking.toggle();
  }

  return (
    <div className={styles.body}>
      {/* Sentence + audio — blurred by default */}
      <SentenceDisplay
        lesson={lesson}
        blurrable
        onRevealChange={(visible) => {
          setTextVisible(visible);
          if (visible) {
            writeStreak.miss();
            speakStreak.miss();
          }
        }}
      />

      {/* Writing practice */}
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

      {/* Speaking practice */}
      <div>
        <SectionHeader
          label="Speaking Practice"
          bestTime={speakTimer.bestTime}
          streak={speakStreak.streak}
          streakGoal={speakStreak.goal}
        />

        <RecordButton
          isListening={speaking.isListening}
          isProcessing={speaking.isProcessing}
          error={speaking.error}
          onToggle={handleRecordToggle}
          showHint={!speaking.result}
        />

        {speaking.result && !speaking.isProcessing && (
          <FeedbackAlert theme={speaking.result.correct ? "correct" : "wrong"}>
            <span>
              {speaking.result.correct
                ? "Correct!"
                : "Not quite \u2014 try again"}
            </span>
            {speaking.result.correct && speakTimer.elapsed !== null && (
              <span className={styles.timeInfo}>
                {speakTimer.elapsed.toFixed(1)}s
              </span>
            )}
            {speaking.result.correct &&
              speakTimer.bestTime !== null &&
              speakTimer.elapsed === speakTimer.bestTime && (
                <span className={styles.newBest}>&nbsp;New best!</span>
              )}
          </FeedbackAlert>
        )}

        {speaking.result && !speaking.result.correct && (
          <div style={{ marginTop: "0.5rem" }}>
            <CorrectionDisplay words={speaking.result.words} />
          </div>
        )}

      </div>

      <Button onClick={onReady}>
        {"I\u2019m ready \u2014 test me"}
      </Button>
    </div>
  );
}
