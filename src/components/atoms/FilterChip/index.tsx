"use client";

import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import style from "./FilterChip.module.css";

interface Props {
  label: string;
  selected: boolean;
  onClick: () => void;
  showRemove?: boolean;
}

export default function FilterChip({
  label,
  selected,
  onClick,
  showRemove = false,
}: Props) {
  return (
    <button
      className={classNames(style.chip, selected && style.selected)}
      onClick={onClick}
    >
      {label}
      {showRemove && selected && (
        <FontAwesomeIcon icon={faXmark} className={style.icon} />
      )}
    </button>
  );
}
