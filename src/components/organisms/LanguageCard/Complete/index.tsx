"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faArrowLeft, faRotateRight } from "@fortawesome/free-solid-svg-icons";
import Countdown from "@/components/atoms/Countdown";
import { ILesson } from "@lib/types";
import styles from "./Complete.module.css";

interface Props {
  lesson: ILesson;
  onNext: (() => void) | null;
  onPractice?: () => void;
  nextReview?: number | null;
}

export default function Complete({ lesson, onNext, onPractice, nextReview }: Props) {
  return (
    <div className={styles.completeBody}>
      <div className={styles.checkCircle}>
        <FontAwesomeIcon icon={faCircleCheck} />
      </div>
      <h2 className={styles.completeTitle}>
        You{"\u2019"}ve learned a new sentence!
      </h2>
      {nextReview && nextReview > Date.now() && (
        <>
          <p className={styles.completeSubtitle}>
            It has now moved into reviews, and you will be tested on it in:
          </p>
          <p className={styles.countdown}>
            <Countdown targetTime={nextReview} />
          </p>
        </>
      )}
      {(!nextReview || nextReview <= Date.now()) && (
        <p className={styles.completeSubtitle}>
          You{"\u2019"}re ready to be tested on it. Check the reviews page!
        </p>
      )}
      {onNext && (
        <button onClick={onNext} className={styles.primaryBtn}>
          <FontAwesomeIcon
            icon={faArrowLeft}
            style={{ marginRight: "0.5em" }}
          />
          Back to lessons
        </button>
      )}
      {onPractice && (
        <button onClick={onPractice} className={styles.secondaryBtn}>
          <FontAwesomeIcon
            icon={faRotateRight}
            style={{ marginRight: "0.5em" }}
          />
          Keep practicing
        </button>
      )}
    </div>
  );
}
