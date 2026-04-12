"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import AudioButton from "@/components/organisms/LanguageCard/AudioButton";
import styles from "./SentenceDisplay.module.css";

interface Props {
  sentence: string;
  translation: string;
  audio: string;
  blurrable?: boolean;
}

export default function SentenceDisplay({ sentence, translation, audio, blurrable }: Props) {
  const [revealed, setRevealed] = useState(!blurrable);

  return (
    <>
      <div className={`${styles.topSection} ${!revealed && styles.topSectionBlurred}`}>
        <div className={styles.sentenceWrap}>
          <p className={styles.sentence}>{sentence}</p>
          <p className={styles.translation}>
            {"\u201C" + translation + "\u201D"}
          </p>
        </div>

        <div className={styles.center}>
          <AudioButton src={audio} />
        </div>
      </div>

      {blurrable && (
        <div className={styles.center}>
          <button
            className={styles.revealBtn}
            onClick={() => setRevealed((prev) => !prev)}
          >
            <FontAwesomeIcon icon={revealed ? faEyeSlash : faEye} />
          </button>
        </div>
      )}
    </>
  );
}
