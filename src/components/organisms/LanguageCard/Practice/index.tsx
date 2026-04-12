"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import AudioButton from "@/components/organisms/LanguageCard/AudioButton";
import WordResult from "@/components/organisms/LanguageCard/WordResult";
import StreakDots from "@/components/organisms/LanguageCard/StreakDots";
import RecordButton from "@/components/organisms/LanguageCard/RecordButton";
import WritingInput from "@/components/organisms/LanguageCard/WritingInput";
import useStreak from "@/components/organisms/LanguageCard/useStreak";
import useBestTime from "@/components/organisms/LanguageCard/useBestTime";
import useWritingCheck from "@/components/organisms/LanguageCard/hooks/useWritingCheck";
import useSpeakingCheck from "@/components/organisms/LanguageCard/hooks/useSpeakingCheck";
import { Lesson } from "@lib/types";
import styles from "./Practice.module.css";

interface Props {
  lesson: Lesson;
  onReady: () => void;
}

export default function Practice({ lesson, onReady }: Props) {
  const [revealed, setRevealed] = useState(false);

  const writeStreak = useStreak("I think you\u2019re ready for the writing test! \u270D\uFE0F");
  const writeTimer = useBestTime();
  const writing = useWritingCheck();

  const speakStreak = useStreak("I think you\u2019re ready for the speaking test! \uD83C\uDF99\uFE0F");
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

  function handleRecordToggle() {
    speakTimer.startTimer();
    speaking.toggle();
  }

  return (
    <div className={styles.body}>
      {/* Sentence + audio — blurred by default */}
      <div className={`${styles.topSection} ${!revealed && styles.topSectionBlurred}`}>
        <div className={styles.sentenceWrap}>
          <p className={styles.sentence}>{lesson.sentence}</p>
          <p className={styles.translation}>
            {"\u201C" + lesson.translation + "\u201D"}
          </p>
        </div>

        <div className={styles.center}>
          <AudioButton src={lesson.audio} />
        </div>
      </div>

      <div className={styles.center}>
        <button
          className={styles.revealBtn}
          onClick={() => setRevealed((prev) => !prev)}
        >
          <FontAwesomeIcon icon={revealed ? faEyeSlash : faEye} />
        </button>
      </div>

      {/* Writing practice */}
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
          {writing.result !== null && !writing.hasErrors && !writing.hasWarnings && (
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

      {/* Speaking practice */}
      <div>
        <div className={styles.sectionHeader}>
          <p className={styles.sectionLabel}>Speaking Practice</p>
          <div className={styles.sectionMeta}>
            <span className={styles.bestTime}>
              Best: {speakTimer.bestTime !== null ? speakTimer.bestTime.toFixed(1) + "s" : "\u2014"}
            </span>
            <StreakDots streak={speakStreak.streak} goal={speakStreak.goal} />
          </div>
        </div>

        <RecordButton
          isListening={speaking.isListening}
          isProcessing={speaking.isProcessing}
          isSupported={speaking.isSupported}
          error={speaking.error}
          onToggle={handleRecordToggle}
          showHint={!speaking.result}
        />

        {speaking.result && !speaking.isProcessing && (
          <div
            className={`${styles.alert} ${speaking.result.correct ? styles.feedbackCorrect : styles.feedbackWrong}`}
            style={{ marginTop: "0.75rem" }}
          >
            <span>{speaking.result.correct ? "Correct!" : "Not quite \u2014 try again"}</span>
            {speaking.result.correct && speakTimer.elapsed !== null && (
              <span className={styles.timeInfo}>
                {speakTimer.elapsed.toFixed(1)}s
              </span>
            )}
            {speaking.result.correct && speakTimer.bestTime !== null && speakTimer.elapsed === speakTimer.bestTime && (
              <span className={styles.newBest}>&nbsp;New best!</span>
            )}
          </div>
        )}

        {speaking.result && !speaking.result.correct && (
          <div className={styles.wordList} style={{ marginTop: "0.5rem" }}>
            {speaking.result.words
              .filter((w) => !w.correct)
              .map((w, i) => (
                <WordResult key={i} word={w} />
              ))}
          </div>
        )}
      </div>

      <button onClick={onReady} className={styles.primaryBtn}>
        {"I\u2019m ready \u2014 test me"}
      </button>
    </div>
  );
}
