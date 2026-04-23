"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faLock,
  faLockOpen,
} from "@fortawesome/free-solid-svg-icons";
import FeedbackAlert from "@atoms/FeedbackAlert";
import Button from "@atoms/Button";
import WritingInput from "@/components/organisms/LanguageCard/WritingInput";
import useWritingCheck from "@/components/organisms/LanguageCard/hooks/useWritingCheck";
import { ILesson } from "@lib/types";
import styles from "./WritingPractice.module.css";

interface Props {
  lesson: ILesson;
  languageLabel: string;
  onReady: () => void;
  isFirstTime?: boolean;
  initialSpeakingUnlocked?: boolean;
  onSpeakingUnlocked?: () => void;
}

export default function WritingPractice({
  lesson,
  languageLabel,
  onReady,
  isFirstTime = false,
  initialSpeakingUnlocked = false,
  onSpeakingUnlocked,
}: Props) {
  const [speakingUnlocked, setSpeakingUnlocked] = useState(
    initialSpeakingUnlocked
  );
  const writing = useWritingCheck();

  function handleWriteSubmit(input: string) {
    const { passed, onlyAccentIssues } = writing.check(lesson.sentence, input);
    if (passed && !speakingUnlocked) {
      setSpeakingUnlocked(true);
      onSpeakingUnlocked?.();
    }
    return onlyAccentIssues;
  }

  function handleWriteInputChange() {
    if (writing.result !== null) writing.clear();
  }

  useEffect(
    function listenForDevPass() {
      if (process.env.NODE_ENV !== "development") return;
      function handleDevPass() {
        if (!speakingUnlocked) {
          setSpeakingUnlocked(true);
          onSpeakingUnlocked?.();
        }
        onReady();
      }
      window.addEventListener("dev:pass-writing", handleDevPass);
      return () => {
        window.removeEventListener("dev:pass-writing", handleDevPass);
      };
    },
    [speakingUnlocked, onSpeakingUnlocked, onReady]
  );

  return (
    <div className={styles.body}>
      <div className={styles.translationWrap}>
        <p className={styles.translation}>
          {"\u201C" + lesson.translation + "\u201D"}
        </p>
        <p className={styles.hint}>{`Write it in ${languageLabel}!`}</p>
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
        >
          {writing.result !== null && writing.isPass && (
            <FeedbackAlert theme="correct">
              <span>
                {
                  "Correct! You\u2019re ready for the speaking practice. Still not feeling confident? Keep practicing before you move on."
                }
              </span>
            </FeedbackAlert>
          )}
        </WritingInput>
      </div>

      <Button onClick={onReady} disabled={isFirstTime && !speakingUnlocked}>
        {isFirstTime && !speakingUnlocked && (
          <FontAwesomeIcon icon={faLock} style={{ marginRight: "0.5em" }} />
        )}
        {isFirstTime && speakingUnlocked && (
          <FontAwesomeIcon icon={faLockOpen} style={{ marginRight: "0.5em" }} />
        )}
        Speaking Practice
        <FontAwesomeIcon
          icon={faChevronRight}
          style={{ marginLeft: "0.5em" }}
        />
      </Button>
    </div>
  );
}
