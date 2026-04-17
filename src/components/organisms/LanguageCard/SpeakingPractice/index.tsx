"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faLockOpen } from "@fortawesome/free-solid-svg-icons";
import CorrectionDisplay from "@/components/atoms/CorrectionDisplay";
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
  onReady: () => void;
  isFirstTime?: boolean;
  initialLessonLearned?: boolean;
  onLessonLearned?: () => void;
}

export default function SpeakingPractice({
  lesson,
  locale,
  languageLabel,
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
