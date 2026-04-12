"use client";

import { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import Spinner from "@atoms/Spinner";
import classNames from "classnames";
import style from "./Button.module.css";

interface Props {
  children: ReactNode;
  theme?: "primary" | "secondary" | "danger" | "ghost";
  type?: "button" | "submit";
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export default function Button({
  children,
  theme = "primary",
  type = "button",
  loading = false,
  disabled = false,
  onClick,
}: Props) {
  return (
    <button
      type={type}
      className={classNames(style.button, style[theme])}
      disabled={disabled || loading}
      onClick={onClick}
    >
      <span className={classNames(style.content, loading && style.faded)}>
        {children}
      </span>

      <AnimatePresence>
        {loading && (
          <motion.span
            className={style.spinner}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Spinner
              color={theme === "secondary" || theme === "ghost" ? "var(--text-secondary)" : "white"}
            />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
