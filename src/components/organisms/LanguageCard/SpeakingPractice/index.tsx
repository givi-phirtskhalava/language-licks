"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faLockOpen } from "@fortawesome/free-solid-svg-icons";
import CorrectionDisplay from "@/components/atoms/CorrectionDisplay";
import PronunciationFeedback from "@/components/atoms/PronunciationFeedback";
import FeedbackAlert from "@atoms/FeedbackAlert";
import Button from "@atoms/Button";
import RecordButton from "@atoms/RecordButton";
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
  initialLessonLearned?: boolean;
  onLessonLearned?: () => void;
}

export default function SpeakingPractice({
  lesson,
  locale,
  languageLabel,
  credits,
  onReady,
  isFirstTime = false,
  initialLessonLearned = false,
  onLessonLearned,
}: Props) {
  const [lessonLearned, setLessonLearned] = useState(initialLessonLearned);
  const speaking = useSpeakingCheck(
    locale,
    lesson.sentence,
    () => {
      if (!lessonLearned) {
        setLessonLearned(true);
        onLessonLearned?.();
      }
    },
    () => {}
  );

  function handleRecordToggle() {
    speaking.toggle();
  }

  return (
    <div className={styles.body}>
      <div className={styles.translationWrap}>
        <p className={styles.translation}>
          {"\u201C" + lesson.translation + "\u201D"}
        </p>
        <p className={styles.hint}>{`Say it in ${languageLabel}!`}</p>
      </div>

      <div>
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
                ? "Correct! You\u2019re ready to complete the lesson. Still not feeling confident? Keep practicing before you move on."
                : "Not quite \u2014 try again"}
            </span>
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

      <Button onClick={onReady} disabled={isFirstTime && !lessonLearned}>
        {isFirstTime && !lessonLearned && (
          <FontAwesomeIcon icon={faLock} style={{ marginRight: "0.5em" }} />
        )}
        {isFirstTime && lessonLearned && (
          <FontAwesomeIcon icon={faLockOpen} style={{ marginRight: "0.5em" }} />
        )}
        Complete Lesson
      </Button>
    </div>
  );
}
