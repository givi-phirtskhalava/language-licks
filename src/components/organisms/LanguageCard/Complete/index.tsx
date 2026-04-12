"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { Lesson } from "@lib/types";
import styles from "./Complete.module.css";

interface Props {
  lesson: Lesson;
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
        {"You\u2019ve mastered \u201C"}
        {lesson.sentence.slice(0, 30)}
        {"\u2026\u201D"}
      </p>
      {onNext && (
        <button onClick={onNext} className={styles.primaryBtn}>
          <FontAwesomeIcon
            icon={faArrowRight}
            style={{ marginRight: "0.5rem" }}
          />
          Next lesson
        </button>
      )}
      {!onNext && (
        <p className={styles.doneText}>
          {"No more lessons \u2014 you\u2019re done for now!"}
        </p>
      )}
    </div>
  );
}
