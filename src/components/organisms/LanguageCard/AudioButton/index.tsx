"use client";

import { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import styles from "./AudioButton.module.css";

interface Props {
  src: string;
}

export default function AudioButton({ src }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  function play() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play();
    setIsPlaying(true);
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={src}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
      />
      <button onClick={play} className={styles.audioBtn}>
        <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
        {isPlaying ? "Playing" : "Listen"}
      </button>
    </>
  );
}
