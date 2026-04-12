"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import SentenceDisplay from "@/components/organisms/LanguageCard/SentenceDisplay";
import CorrectionDisplay from "@/components/atoms/CorrectionDisplay";
import SectionHeader from "@/components/atoms/SectionHeader";
import RecordButton from "@/components/organisms/LanguageCard/RecordButton";
import useStreak from "@/components/organisms/LanguageCard/useStreak";
import useBestTime from "@/components/organisms/LanguageCard/useBestTime";
import useSpeakingCheck from "@/components/organisms/LanguageCard/hooks/useSpeakingCheck";
import { ILesson } from "@lib/types";
import styles from "./SpeakingPractice.module.css";

interface Props {
  lesson: ILesson;
  locale: string;
  onReady: () => void;
}

export default function SpeakingPractice({ lesson, locale, onReady }: Props) {
  const speakStreak = useStreak("I think you\u2019re ready for the test! \uD83C\uDF99\uFE0F");
  const speakTimer = useBestTime();
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
    },
  );

  function handleRecordToggle() {
    speakTimer.startTimer();
    speaking.toggle();
  }

  return (
    <div className={styles.body}>
      <SentenceDisplay
        lesson={lesson}
        blurrable
        onRevealChange={(visible) => {
          if (visible) speakStreak.miss();
        }}
      />

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
          <div style={{ marginTop: "0.5rem" }}>
            <CorrectionDisplay words={speaking.result.words} />
          </div>
        )}
      </div>

      <button onClick={onReady} className={styles.primaryBtn}>
        Test
        <FontAwesomeIcon icon={faChevronRight} style={{ marginLeft: "0.5rem" }} />
      </button>
    </div>
  );
}
