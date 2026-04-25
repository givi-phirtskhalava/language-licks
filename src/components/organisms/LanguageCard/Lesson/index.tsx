"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import {
  faCircleInfo,
  faThoughtBubble,
} from "@fortawesome/pro-regular-svg-icons";
import SentenceDisplay from "@/components/organisms/LanguageCard/SentenceDisplay";
import Button from "@atoms/Button";
import { ILesson } from "@lib/types";
import styles from "./Lesson.module.css";

interface Props {
  lesson: ILesson;
  onReady: () => void;
}

export default function LessonPhase({ lesson, onReady }: Props) {
  return (
    <div className={styles.body}>
      <SentenceDisplay lesson={lesson} />

      {lesson.context && (
        <p className={styles.context}>
          <FontAwesomeIcon icon={faCircleInfo} className={styles.contextIcon} />
          {lesson.context}
        </p>
      )}

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

      {lesson.liaisonTips && lesson.liaisonTips.length > 0 && (
        <div>
          <p className={styles.sectionLabel}>Liaison Tips</p>
          <div className={styles.grammarList} style={{ marginTop: "0.5rem" }}>
            {lesson.liaisonTips.map((tip) => (
              <div key={tip.phrase} className={styles.grammarItem}>
                <span className={styles.grammarLabel}>{tip.phrase}</span>
                <p className={styles.grammarExplanation}>{tip.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button onClick={onReady}>
        Writing Practice
        <FontAwesomeIcon
          icon={faChevronRight}
          style={{ marginLeft: "0.5em" }}
        />
      </Button>
    </div>
  );
}
