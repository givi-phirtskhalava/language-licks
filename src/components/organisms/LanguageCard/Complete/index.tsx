"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faArrowLeft,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@atoms/Button";
import { ILesson } from "@lib/types";
import { getToday } from "@lib/useProgress";
import styles from "./Complete.module.css";

interface Props {
  lesson: ILesson;
  mode?: "lesson" | "review";
  onNext: (() => void) | null;
  onPractice?: () => void;
  onNextReview?: () => void;
  nextReview?: string | null;
}

function daysUntilReview(nextReview: string): number {
  const today = new Date(getToday() + "T00:00:00");
  const review = new Date(String(nextReview).slice(0, 10) + "T00:00:00");
  const diff = review.getTime() - today.getTime();
  if (!Number.isFinite(diff)) return 1;
  return Math.max(1, Math.round(diff / (24 * 60 * 60 * 1000)));
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
        {nextReview && nextReview > getToday() && (
          <p className={styles.completeSubtitle}>
            Next review in {daysUntilReview(nextReview)} day
            {daysUntilReview(nextReview) !== 1 ? "s" : ""}
          </p>
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
      {nextReview && nextReview > getToday() && (
        <p className={styles.completeSubtitle}>
          It has now moved into reviews. Next review in{" "}
          {daysUntilReview(nextReview)} day
          {daysUntilReview(nextReview) !== 1 ? "s" : ""}.
        </p>
      )}
      {(!nextReview || nextReview <= getToday()) && (
        <p className={styles.completeSubtitle}>
          You{"\u2019"}re ready to be tested on it. Check the reviews page!
        </p>
      )}

      <p className={styles.completeSubtitle}>
        Try to think of this sentence throughout your day or repeat it before
        going to sleep instead of counting sheep. The more you practice, the
        better you will remember it!
      </p>

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
