"use client";

import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { faClock, faSparkles } from "@fortawesome/pro-regular-svg-icons";
import toast from "react-hot-toast";
import useLanguage from "@lib/useLanguage";
import useAuth from "@lib/hooks/useAuth";
import useProgress, {
  getMasteryLevel,
  getReviewBucket,
  getDaysUntilReview,
  getToday,
} from "@lib/useProgress";
import { ILessonListItem, TPhase } from "@lib/types";
import CardFooter from "./CardFooter";
import Tag from "./Tag";
import style from "./LessonItem.module.css";

interface Props {
  type: "lesson" | "review";
  lesson: ILessonListItem;
  index?: number;
  onClick: () => void;
  onSettingsClick?: () => void;
}

function getPhaseLabel(phase: TPhase): string {
  switch (phase) {
    case "practice-writing":
      return "Writing practice";
    case "practice-speaking":
      return "Speaking practice";
    case "practice":
      return "Practicing";
    case "test":
      return "Testing";
    default:
      return "In progress";
  }
}

export default function LessonItem({
  type,
  lesson,
  index,
  onClick,
  onSettingsClick,
}: Props) {
  const { language } = useLanguage();
  const { isPremium } = useAuth();
  const { getLesson, pausedAt } = useProgress(language);

  const p = getLesson(lesson.id);
  const level = getMasteryLevel(p);

  if (type === "lesson") {
    const completed = p?.completed && !p.retired;
    const retired = p?.retired;
    const hasProgress = p && (p.completed || p.phase !== "lesson");
    const displayIndex = (index ?? 0) + 1;

    return (
      <div
        className={style.item}
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        aria-label={`Open lesson ${displayIndex}: ${lesson.sentence}`}
      >
        <div className={style.itemBtn}>
          <span
            className={classNames(
              style.number,
              completed && style.numberCompleted,
              retired && style.numberRetired
            )}
          >
            {displayIndex}
          </span>

          <div className={style.itemContent}>
            <p className={style.sentence}>{lesson.sentence}</p>

            {retired && (
              <p className={style.tag}>{"Mastered — tap to review"}</p>
            )}
          </div>
        </div>

        <CardFooter
          level={completed ? level : undefined}
          onInfoClick={
            hasProgress && onSettingsClick
              ? (e) => {
                  e.stopPropagation();
                  onSettingsClick();
                }
              : undefined
          }
          infoAriaLabel="Lesson info and stats"
        >
          {!isPremium && lesson.isFree && (
            <span className={style.freeBadge}>Free</span>
          )}
          {p && !p.completed && <Tag>{getPhaseLabel(p.phase)}</Tag>}
        </CardFooter>
      </div>
    );
  }

  const today = getToday();
  const bucket = getReviewBucket(p, pausedAt, today);

  if (!bucket) return null;

  if (bucket === "ready") {
    return (
      <div className={classNames(style.item, style.ready)}>
        <button className={style.itemBtn} onClick={onClick}>
          <span className={classNames(style.number, style.numberReady)}>
            <FontAwesomeIcon icon={faSparkles} />
          </span>

          <div className={style.itemContent}>
            <p className={style.sentence}>{lesson.translation}</p>
          </div>
        </button>

        <CardFooter
          level={level}
          onInfoClick={onSettingsClick}
          infoAriaLabel="Lesson info and stats"
        />
      </div>
    );
  }

  if (bucket === "problematic") {
    return (
      <div className={classNames(style.item, style.problematic)}>
        <button className={style.itemBtn} onClick={onClick}>
          <span className={classNames(style.number, style.numberProblematic)}>
            <FontAwesomeIcon icon={faTriangleExclamation} />
          </span>

          <div className={style.itemContent}>
            <p className={style.sentence}>{lesson.translation}</p>
          </div>
        </button>

        <CardFooter
          level={level}
          tag="Go back to learn"
          onInfoClick={onSettingsClick}
          infoAriaLabel="Lesson info and stats"
        />
      </div>
    );
  }

  const daysLeft = p?.nextReview ? getDaysUntilReview(p.nextReview, today) : 1;
  const tag = pausedAt
    ? "Paused"
    : `Review in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`;

  function handleComingUpClick() {
    toast.dismiss();
    toast.error(
      pausedAt
        ? "Reviews are paused"
        : `Not ready yet! Review in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`
    );
  }

  return (
    <div className={classNames(style.item, style.comingUp)}>
      <button className={style.itemBtn} onClick={handleComingUpClick}>
        <span className={classNames(style.number, style.numberComingUp)}>
          <FontAwesomeIcon icon={faClock} />
        </span>

        <div className={style.itemContent}>
          <p className={style.sentence}>{lesson.translation}</p>
        </div>
      </button>

      <CardFooter
        level={level}
        tag={tag}
        onInfoClick={onSettingsClick}
        infoAriaLabel="Lesson info and stats"
      />
    </div>
  );
}
