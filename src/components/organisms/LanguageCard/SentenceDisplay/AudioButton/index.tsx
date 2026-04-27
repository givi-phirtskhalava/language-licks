"use client";

import { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import styles from "./AudioButton.module.css";

interface Props {
  src: string | null;
  label: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onEnd: () => void;
}

export default function AudioButton({
  src,
  label,
  isPlaying,
  onTogglePlay,
  onEnd,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(
    function syncPlayback() {
      const audio = audioRef.current;
      if (!audio) return;

      if (isPlaying) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    },
    [isPlaying]
  );

  if (!src) {
    return (
      <button className={styles.audioBtn} disabled>
        <FontAwesomeIcon icon={faPlay} />
        {label}
      </button>
    );
  }

  return (
    <>
      <audio ref={audioRef} src={src} onEnded={onEnd} />
      <button onClick={onTogglePlay} className={styles.audioBtn}>
        <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
        {label}
      </button>
    </>
  );
}
