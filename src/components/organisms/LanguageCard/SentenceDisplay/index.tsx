"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import AudioButton from "./AudioButton";
import { ILesson } from "@lib/types";
import styles from "./SentenceDisplay.module.css";

interface Props {
  lesson: ILesson;
  showAudio?: boolean;
  blurrable?: boolean;
  alwaysBlurred?: boolean;
  hint?: string;
  onRevealChange?: (revealed: boolean) => void;
}

export default function SentenceDisplay({
  lesson,
  showAudio = true,
  blurrable,
  alwaysBlurred,
  hint,
  onRevealChange,
}: Props) {
  const [revealed, setRevealed] = useState(!blurrable);
  const blurred = alwaysBlurred || !revealed;

  return (
    <>
      <div
        className={`${styles.topSection} ${blurred && styles.topSectionBlurred}`}
      >
        <div className={styles.sentenceWrap}>
          <p className={styles.sentence}>{lesson.sentence}</p>
          <p className={styles.translation}>
            {"\u201C" + lesson.translation + "\u201D"}
          </p>
        </div>

        {showAudio && (
          <div className={styles.center}>
            <AudioButton src={lesson.audio} />
          </div>
        )}
      </div>

      {hint && <p className={styles.hint}>{hint}</p>}

      {blurrable && !alwaysBlurred && (
        <div className={styles.center}>
          <button
            className={styles.revealBtn}
            onClick={() => {
              setRevealed((prev) => {
                onRevealChange?.(!prev);
                return !prev;
              });
            }}
          >
            <FontAwesomeIcon icon={revealed ? faEyeSlash : faEye} />
          </button>
        </div>
      )}
    </>
  );
}
