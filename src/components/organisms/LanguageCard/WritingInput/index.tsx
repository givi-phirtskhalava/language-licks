"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import CorrectionDisplay from "@/components/atoms/CorrectionDisplay";
import { IWriteWordResult } from "@/components/organisms/LanguageCard/hooks/useWritingCheck";
import useLanguage from "@lib/useLanguage";
import { TLanguageId } from "@lib/projectConfig";
import styles from "./WritingInput.module.css";

const ACCENT_CHARS: Record<TLanguageId, string[]> = {
  french: ["é", "è", "ê", "à", "â", "ç", "ù", "î", "ô", "ë", "ï", "œ"],
  italian: ["à", "è", "é", "ì", "ò", "ù"],
};

interface Props {
  onSubmit: (input: string) => boolean | void;
  onInputChange?: () => void;
  result?: IWriteWordResult[] | null;
  hasErrors?: boolean;
  hasWarnings?: boolean;
  isPass?: boolean;
  onlyAccentIssues?: boolean;
  hideCorrectionsOnAccentHint?: boolean;

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
  placeholder = "Type the sentence here…",
  disabled,
  children,
}: Props) {
  const [input, setInput] = useState("");
  const [pendingCaret, setPendingCaret] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { language } = useLanguage();
  const accents = ACCENT_CHARS[language] ?? [];

  useEffect(() => {
    if (disabled) {
      setInput("");
      return;
    }
    inputRef.current?.focus();
  }, [disabled]);

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [input]);

  useLayoutEffect(() => {
    if (pendingCaret === null) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(pendingCaret, pendingCaret);
    setPendingCaret(null);
  }, [pendingCaret, input]);

  function submitInput() {
    if (!input.trim()) return;
    const keepInput = onSubmit(input);
    if (!keepInput) setInput("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitInput();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitInput();
    }
  }

  function insertAccent(char: string) {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = el.value.slice(0, start) + char + el.value.slice(end);
    setInput(next);
    onInputChange?.();
    setPendingCaret(start + char.length);
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
      <form onSubmit={handleSubmit} className={styles.form}>
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            onInputChange?.();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`${styles.input} ${inputStateClass}`}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          disabled={disabled}
        />

        {accents.length > 0 && !disabled && (
          <div className={styles.accentRow} role="toolbar" aria-label="Insert accented character">
            {accents.map((char) => (
              <button
                key={char}
                type="button"
                className={styles.accentBtn}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertAccent(char)}
                tabIndex={-1}
                aria-label={`Insert ${char}`}
              >
                {char}
              </button>
            ))}
          </div>
        )}

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!input.trim() || disabled}
        >
          <FontAwesomeIcon icon={faPen} className={styles.submitBtnIcon} />
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
        </div>
      )}
    </>
  );
}
