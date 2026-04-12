"use client";

import { ReactNode } from "react";
import style from "./Modal.module.css";

interface Props {
  children: ReactNode;
  onClose: () => void;
}

export default function Modal({ children, onClose }: Props) {
  return (
    <div className={style.overlay} onClick={onClose}>
      <div className={style.content} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
