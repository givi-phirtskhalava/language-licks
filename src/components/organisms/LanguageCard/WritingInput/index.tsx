"use client";

import { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { WriteWordResult } from "@/components/organisms/LanguageCard/hooks/useWritingCheck";
import styles from "./WritingInput.module.css";

interface Props {
  onSubmit: (input: string) => void;
  onInputChange?: () => void;
  result?: WriteWordResult[] | null;
  hasErrors?: boolean;
  hasWarnings?: boolean;
  isPass?: boolean;
  onRetry?: () => void;
  placeholder?: string;
  children?: React.ReactNode;
}

export default function WritingInput({
  onSubmit,
  onInputChange,
  result,
  hasErrors,
  hasWarnings,
  isPass,
  onRetry,
  placeholder = "Type the sentence here\u2026",
  children,
}: Props) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    onSubmit(input);
    setInput("");
  }

  function handleRetry() {
    setInput("");
    onRetry?.();
    inputRef.current?.focus();
  }

  const inputStateClass =
    result === null || result === undefined
      ? ""
      : isPass && !hasWarnings
        ? styles.inputCorrect
        : isPass
          ? styles.inputWarning
          : styles.inputWrong;

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className={styles.form}
        style={{ marginTop: "0.5rem" }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            onInputChange?.();
          }}
          placeholder={placeholder}
          className={`${styles.input} ${inputStateClass}`}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!input.trim()}
        >
          <FontAwesomeIcon icon={faPen} style={{ marginRight: "0.5rem" }} />
          Check
        </button>
      </form>

      {children}

      {result && (hasErrors || hasWarnings) && (
        <div style={{ marginTop: "0.75rem" }}>
          <div className={styles.wordList}>
            {result.map((r, i) => (
              <span
                key={i}
                className={
                  r.status === "correct"
                    ? styles.wordCorrect
                    : r.status === "warning"
                      ? styles.wordWarning
                      : styles.wordError
                }
              >
                {r.expected}
              </span>
            ))}
          </div>

          {onRetry && (
            <button
              type="button"
              className={styles.retryBtn}
              onClick={handleRetry}
            >
              <FontAwesomeIcon icon={faRotateLeft} style={{ marginRight: "0.5rem" }} />
              Try again
            </button>
          )}
        </div>
      )}
    </>
  );
}
