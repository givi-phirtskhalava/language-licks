"use client";

import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import style from "./InfoButton.module.css";
import { faCircleEllipsis } from "@fortawesome/pro-regular-svg-icons";

interface Props {
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  ariaLabel?: string;
}

export default function InfoButton({ onClick, className, ariaLabel }: Props) {
  return (
    <button
      type="button"
      className={classNames(style.button, className)}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <FontAwesomeIcon icon={faCircleEllipsis} />
    </button>
  );
}
