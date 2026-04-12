"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { ILesson } from "@lib/types";
import styles from "./Complete.module.css";

interface Props {
  lesson: ILesson;
  onNext: (() => void) | null;
}

export default function Complete({ lesson, onNext }: Props) {
  return (
    <div className={styles.completeBody}>
      <div className={styles.checkCircle}>
        <FontAwesomeIcon icon={faCircleCheck} />
      </div>
      <h2 className={styles.completeTitle}>Lesson complete!</h2>
      <p className={styles.completeSubtitle}>
        {`You\u2019ve mastered \u201C${lesson.sentence}\u201D`}
      </p>
      {onNext && (
        <button onClick={onNext} className={styles.primaryBtn}>
          <FontAwesomeIcon
            icon={faArrowLeft}
            style={{ marginRight: "0.5em" }}
          />
          Back to lessons
        </button>
      )}
    </div>
  );
}
