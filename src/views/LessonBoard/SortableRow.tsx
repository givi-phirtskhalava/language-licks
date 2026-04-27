"use client";

import Link from "next/link";
import classNames from "classnames";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { ILesson } from "./LessonBoardClient";
import style from "./LessonBoard.module.css";

interface Props {
  lesson: ILesson;
  dragDisabled: boolean;
}

export default function SortableRow({ lesson, dragDisabled }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id, disabled: dragDisabled });

  const transformStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={transformStyle}
      className={classNames(style.row, isDragging && style.rowDragging)}
    >
      <button
        type="button"
        className={classNames(
          style.dragHandle,
          dragDisabled && style.dragHandleDisabled
        )}
        aria-label="Drag to reorder"
        disabled={dragDisabled}
        {...attributes}
        {...listeners}
      >
        <span className={style.dragIcon}>⋮⋮</span>
      </button>

      <Link
        href={`/admin/collections/lessons/${lesson.id}`}
        className={style.rowBody}
      >
        <div className={style.sentence}>
          {lesson._status === "draft" && (
            <span className={style.draftBadge}>[draft]</span>
          )}

          {lesson._status === "changed" && (
            <span className={style.modifiedBadge}>[modified]</span>
          )}

          {lesson.sentence}
        </div>

        <div className={style.translation}>{lesson.translation}</div>
      </Link>

      {lesson.isFree && <div className={style.freeBadge}>Free</div>}
    </div>
  );
}
