"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faArrowLeft,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import Countdown from "@/components/atoms/Countdown";
import Button from "@atoms/Button";
import { ILesson } from "@lib/types";
import styles from "./Complete.module.css";

interface Props {
  lesson: ILesson;
  mode?: "lesson" | "review";
  onNext: (() => void) | null;
  onPractice?: () => void;
  onNextReview?: () => void;
  nextReview?: number | null;
}

export default function Complete({
  lesson,
  mode = "lesson",
  onNext,
  onPractice,
  onNextReview,
  nextReview,
}: Props) {
  if (mode === "review") {
    return (
      <div className={styles.completeBody}>
        <div className={styles.checkCircle}>
          <FontAwesomeIcon icon={faCircleCheck} />
        </div>
        <h2 className={styles.completeTitle}>Review completed!</h2>
        {nextReview && nextReview > Date.now() && (
          <>
            <p className={styles.completeSubtitle}>
              It will come back for another review in:
            </p>
            <p className={styles.countdown}>
              <Countdown targetTime={nextReview} />
            </p>
          </>
        )}
        {onNextReview && <Button onClick={onNextReview}>Next review</Button>}
        {onNext && (
          <Button theme="secondary" onClick={onNext}>
            <FontAwesomeIcon
              icon={faArrowLeft}
              style={{ marginRight: "0.5em" }}
            />
            Back to reviews
          </Button>
        )}
      </div>
    );
  }

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
        <Button onClick={onNext}>
          <FontAwesomeIcon
            icon={faArrowLeft}
            style={{ marginRight: "0.5em" }}
          />
          Back to lessons
        </Button>
      )}
      {onPractice && (
        <Button theme="secondary" onClick={onPractice}>
          <FontAwesomeIcon
            icon={faRotateRight}
            style={{ marginRight: "0.5em" }}
          />
          Revise this lesson
        </Button>
      )}
    </div>
  );
}
