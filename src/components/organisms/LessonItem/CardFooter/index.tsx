"use client";

import { Children, ReactNode } from "react";
import MasteryBar from "@/components/atoms/MasteryBar";
import InfoButton from "@/components/atoms/InfoButton";
import Tag from "@/components/atoms/Tag";
import style from "./CardFooter.module.css";

interface Props {
  level?: number;
  tag?: string;
  onInfoClick?: (e: React.MouseEvent) => void;
  infoAriaLabel?: string;
  children?: ReactNode;
}

export default function CardFooter({
  level,
  tag,
  onInfoClick,
  infoAriaLabel,
  children,
}: Props) {
  const hasChildren = Children.toArray(children).length > 0;
  const hasContent =
    hasChildren ||
    typeof level === "number" ||
    tag !== undefined ||
    onInfoClick !== undefined;

  if (!hasContent) return null;

  return (
    <div className={style.footer}>
      {children}
      {typeof level === "number" && <MasteryBar level={level} />}
      {tag && <Tag>{tag}</Tag>}
      {onInfoClick && (
        <InfoButton
          onClick={onInfoClick}
          ariaLabel={infoAriaLabel ?? "Info"}
        />
      )}
    </div>
  );
}
