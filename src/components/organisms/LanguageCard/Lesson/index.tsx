"use client";

import AudioButton from "@/components/organisms/LanguageCard/AudioButton";
import { Lesson } from "@lib/types";
import styles from "./Lesson.module.css";

interface Props {
  lesson: Lesson;
  onReady: () => void;
}

export default function LessonPhase({ lesson, onReady }: Props) {
  return (
    <div className={styles.body}>
      <div className={styles.sentenceWrap}>
        <p className={styles.sentence}>{lesson.sentence}</p>
        <p className={styles.translation}>
          {"\u201C" + lesson.translation + "\u201D"}
        </p>
      </div>

      <div className={styles.center}>
        <AudioButton src={lesson.audio} />
      </div>

      <div>
        <p className={styles.sectionLabel}>Grammar Breakdown</p>
        <div className={styles.grammarList} style={{ marginTop: "0.5rem" }}>
          {lesson.grammar.map((note) => (
            <div key={note.label} className={styles.grammarItem}>
              <span className={styles.grammarLabel}>{note.label}</span>
              <p className={styles.grammarExplanation}>{note.explanation}</p>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onReady} className={styles.primaryBtn}>
        {"I\u2019m ready \u2014 start practicing"}
      </button>
    </div>
  );
}
