"use client";

import CorrectionDisplay from "@/components/atoms/CorrectionDisplay";
import PronunciationFeedback from "@/components/atoms/PronunciationFeedback";
import FeedbackAlert from "@atoms/FeedbackAlert";
import Button from "@atoms/Button";
import SectionHeader from "@/components/atoms/SectionHeader";
import RecordButton from "@atoms/RecordButton";
import useStreak from "@/components/organisms/LanguageCard/useStreak";
import useBestTime from "@/components/organisms/LanguageCard/useBestTime";
import useSpeakingCheck from "@/components/organisms/LanguageCard/hooks/useSpeakingCheck";
import { ILesson } from "@lib/types";
import styles from "./SpeakingPractice.module.css";

interface Props {
  lesson: ILesson;
  locale: string;
  languageLabel: string;
  credits: number | null;
  onReady: () => void;
  isFirstTime?: boolean;
  initialStreak?: number;
  initialBestTime?: number | null;
  onStreakChange?: (streak: number) => void;
  onBestTimeChange?: (time: number) => void;
}

export default function SpeakingPractice({
  lesson,
  locale,
  languageLabel,
  credits,
  onReady,
  isFirstTime = false,
  initialStreak = 0,
  initialBestTime = null,
  onStreakChange,
  onBestTimeChange,
}: Props) {
  const speakStreak = useStreak({ initialStreak, onStreakChange });
  const speakTimer = useBestTime({ initialBestTime, onBestTimeChange });
  const speaking = useSpeakingCheck(
    locale,
    lesson.sentence,
    () => {
      speakTimer.stopTimer();
      speakStreak.hit();
    },
    () => {
      speakTimer.resetTimer();
      speakStreak.miss();
    }
  );

  function handleRecordToggle() {
    speakTimer.startTimer();
    speaking.toggle();
  }

  return (
    <div className={styles.body}>
      <div className={styles.translationWrap}>
        <p className={styles.translation}>
          {"\u201C" + lesson.translation + "\u201D"}
        </p>
        <p className={styles.hint}>
          {isFirstTime
            ? `Say it correctly in ${languageLabel} three times!`
            : `Say it in ${languageLabel}!`}
        </p>
      </div>

      <div>
        {isFirstTime && (
          <SectionHeader
            bestTime={speakTimer.bestTime}
            streak={speakStreak.streak}
            streakGoal={speakStreak.goal}
          />
        )}

        <RecordButton
          isListening={speaking.isListening}
          isProcessing={speaking.isProcessing}
          error={speaking.error}
          onToggle={handleRecordToggle}
          credits={credits}
        />

        {speaking.result && !speaking.isProcessing && (
          <FeedbackAlert theme={speaking.result.correct ? "correct" : "wrong"}>
            <span>
              {speaking.result.correct
                ? "Correct!" +
                  (speakStreak.streak === speakStreak.goal
                    ? " You\u2019re ready to complete the lesson."
                    : "")
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

        {/* TODO: bring back when pronunciation assessment can coexist with real STT
        {speaking.result &&
          speaking.result.pronunciation &&
          !speaking.isProcessing && (
            <PronunciationFeedback
              accuracyScore={speaking.result.pronunciation.accuracyScore}
              wordScores={speaking.result.pronunciation.words}
            />
          )}
        */}
      </div>

      <Button
        onClick={onReady}
        disabled={isFirstTime && speakStreak.streak < speakStreak.goal}
      >
        Complete Lesson
      </Button>
    </div>
  );
}
