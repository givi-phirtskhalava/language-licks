"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import CorrectionDisplay from "@/components/atoms/CorrectionDisplay";
import { IWriteWordResult } from "@/components/organisms/LanguageCard/hooks/useWritingCheck";
import styles from "./WritingInput.module.css";

interface Props {
  onSubmit: (input: string) => boolean | void;
  onInputChange?: () => void;
  result?: IWriteWordResult[] | null;
  hasErrors?: boolean;
  hasWarnings?: boolean;
  isPass?: boolean;
  onlyAccentIssues?: boolean;
  hideCorrectionsOnAccentHint?: boolean;
  onRetry?: () => void;
  placeholder?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export default function WritingInput({
  onSubmit,
  onInputChange,
  result,
  hasErrors,
  hasWarnings,
  isPass,
  onlyAccentIssues,
  hideCorrectionsOnAccentHint,
  onRetry,
  placeholder = "Type the sentence here\u2026",
  disabled,
  children,
}: Props) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (disabled) setInput("");
  }, [disabled]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const keepInput = onSubmit(input);
    if (!keepInput) setInput("");
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
          onPaste={(e) => e.preventDefault()}
          placeholder={placeholder}
          className={`${styles.input} ${inputStateClass}`}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          disabled={disabled}
        />
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!input.trim() || disabled}
        >
          <FontAwesomeIcon icon={faPen} style={{ marginRight: "0.5rem" }} />
          Check
        </button>
      </form>

      {children}

      {onlyAccentIssues && (
        <p className={styles.accentHint} style={{ marginTop: "0.75rem" }}>
          Hint: check for missing accents or special characters.
        </p>
      )}

      {result && (hasErrors || (hasWarnings && !(onlyAccentIssues && hideCorrectionsOnAccentHint))) && (
        <div style={{ marginTop: "0.75rem" }}>
          <CorrectionDisplay words={result} />

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
