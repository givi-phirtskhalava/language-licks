"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import SentenceDisplay from "@/components/organisms/LanguageCard/SentenceDisplay";
import WordResult from "@/components/organisms/LanguageCard/WordResult";
import StreakDots from "@/components/organisms/LanguageCard/StreakDots";
import RecordButton from "@/components/organisms/LanguageCard/RecordButton";
import useStreak from "@/components/organisms/LanguageCard/useStreak";
import useBestTime from "@/components/organisms/LanguageCard/useBestTime";
import useSpeakingCheck from "@/components/organisms/LanguageCard/hooks/useSpeakingCheck";
import { ILesson } from "@lib/types";
import styles from "./SpeakingPractice.module.css";

interface Props {
  lesson: ILesson;
  onReady: () => void;
}

export default function SpeakingPractice({ lesson, onReady }: Props) {
  const speakStreak = useStreak("I think you\u2019re ready for the test! \uD83C\uDF99\uFE0F");
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

  function handleRecordToggle() {
    speakTimer.startTimer();
    speaking.toggle();
  }

  return (
    <div className={styles.body}>
      <SentenceDisplay lesson={lesson} blurrable />

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
        Test
        <FontAwesomeIcon icon={faChevronRight} style={{ marginLeft: "0.5rem" }} />
      </button>
    </div>
  );
}
