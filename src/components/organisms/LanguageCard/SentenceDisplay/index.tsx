"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import AudioButton from "./AudioButton";
import { ILesson } from "@lib/types";
import styles from "./SentenceDisplay.module.css";

type TPlaying = "normal" | "slow" | null;

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
  const [playing, setPlaying] = useState<TPlaying>(null);

  const blurred = alwaysBlurred || !revealed;

  function togglePlay(which: Exclude<TPlaying, null>) {
    setPlaying((prev) => (prev === which ? null : which));
  }

  function handleEnd() {
    setPlaying(null);
  }

  return (
    <>
      <div
        className={`${styles.topSection} ${blurred && styles.topSectionBlurred}`}
      >
        <div className={styles.sentenceWrap}>
          <p className={styles.sentence}>{lesson.sentence}</p>
          <p className={styles.translation}>
            {"“" + lesson.translation + "”"}
          </p>
        </div>

        {showAudio && (
          <div className={styles.audioButtons}>
            <AudioButton
              src={lesson.audio.normal}
              label="Listen"
              isPlaying={playing === "normal"}
              onTogglePlay={() => togglePlay("normal")}
              onEnd={handleEnd}
            />
            <AudioButton
              src={lesson.audio.slow}
              label="Slow"
              isPlaying={playing === "slow"}
              onTogglePlay={() => togglePlay("slow")}
              onEnd={handleEnd}
            />
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
