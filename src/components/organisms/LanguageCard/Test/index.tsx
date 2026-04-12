"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faSpinner,
  faPen,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { compareWords, WordComparison } from "@/lib/compareText";
import WordResult from "@/components/organisms/LanguageCard/WordResult";
import { Lesson } from "@lib/types";
import styles from "./Test.module.css";

const MAX_ATTEMPTS = 3;

interface Props {
  lesson: Lesson;
  onPass: () => void;
  onFail: () => void;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/['']/g, "'").replace(/\s+/g, " ").trim();
}

type TestStep = "writing" | "speaking";

export default function Test({ lesson, onPass, onFail }: Props) {
  const [step, setStep] = useState<TestStep>("writing");
  const [attempts, setAttempts] = useState(0);
  const [passed, setPassed] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  // Writing state
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Speaking state
  const {
    transcript,
    resultId,
    isListening,
    isProcessing,
    error,
    isSupported,
    start,
    stop,
  } = useSpeechRecognition("fr-FR");
  const [speakWords, setSpeakWords] = useState<WordComparison[]>([]);

  // Check speech result
  const processedResultId = useRef(0);
  useEffect(() => {
    if (resultId > processedResultId.current && transcript) {
      processedResultId.current = resultId;
      const comparison = compareWords(lesson.sentence, transcript);
      const correct = comparison.score === 1;
      setSpeakWords(comparison.words);
      setLastCorrect(correct);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (correct) {
        setPassed(true);
        setTimeout(onPass, 1200);
      } else if (newAttempts >= MAX_ATTEMPTS) {
        setTimeout(onFail, 1500);
      }
    }
  }, [resultId, transcript, lesson.sentence]);

  // Auto-advance from writing to speaking on pass
  useEffect(() => {
    if (step === "writing" && passed) {
      const timer = setTimeout(() => {
        setStep("speaking");
        setPassed(false);
        setAttempts(0);
        setLastCorrect(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [step, passed]);

  function handleWriteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const correct = normalize(lesson.sentence) === normalize(input);
    setLastCorrect(correct);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (correct) {
      setPassed(true);
    } else {
      setInput("");
      if (newAttempts >= MAX_ATTEMPTS) {
        setTimeout(onFail, 1500);
      }
    }
  }

  async function handlePressStart() {
    if (isProcessing) return;
    setLastCorrect(null);
    setSpeakWords([]);
    const started = await start();
    if (!started) {
      toast.error(
        "Microphone access is blocked. Please allow it in your browser settings.",
        {
          duration: 4000,
        },
      );
    }
  }

  const handlePressEnd = useCallback(() => {
    if (isListening) stop();
  }, [isListening, stop]);

  useEffect(() => {
    if (!isListening) return;
    window.addEventListener("mouseup", handlePressEnd);
    return () => window.removeEventListener("mouseup", handlePressEnd);
  }, [isListening, handlePressEnd]);

  const recordBtnClass = isProcessing
    ? styles.recordProcessing
    : isListening
      ? styles.recordListening
      : styles.recordIdle;

  const attemptsLeft = MAX_ATTEMPTS - attempts;
  const writingDone = step === "writing" && passed;
  const speakingDone = step === "speaking" && passed;
  const failed = attempts >= MAX_ATTEMPTS && !passed;

  const inputStateClass =
    lastCorrect === null
      ? ""
      : lastCorrect
        ? styles.writingInputCorrect
        : styles.writingInputWrong;

  return (
    <div className={styles.body}>
      {/* Sentence — always blurred */}
      <div className={styles.sentenceWrap}>
        <p className={`${styles.sentence} ${styles.sentenceBlurred}`}>
          {lesson.sentence}
        </p>
        <p className={styles.memoryHint}>
          {step === "writing" ? "Write it from memory!" : "Say it from memory!"}
        </p>
      </div>

      {/* Attempts remaining */}
      <div className={styles.streakWrap}>
        <p className={styles.streakLabel}>
          {failed
            ? "No attempts remaining"
            : attemptsLeft +
              " attempt" +
              (attemptsLeft !== 1 ? "s" : "") +
              " remaining"}
        </p>
      </div>

      {/* Writing test */}
      {step === "writing" && !writingDone && !failed && (
        <div>
          <p className={styles.sectionLabel}>Write the sentence</p>
          <form
            onSubmit={handleWriteSubmit}
            className={styles.writingForm}
            style={{ marginTop: "0.5rem" }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (lastCorrect !== null) setLastCorrect(null);
              }}
              placeholder="Type the sentence here..."
              className={`${styles.writingInput} ${inputStateClass}`}
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
        </div>
      )}

      {/* Speaking test */}
      {step === "speaking" && !speakingDone && !failed && (
        <div>
          <p className={styles.sectionLabel}>Say the sentence</p>

          {!isSupported && (
            <p
              className={`${styles.alert} ${styles.alertWarning}`}
              style={{ marginTop: "0.5rem" }}
            >
              Speech recognition is not supported in your browser. Try Chrome or
              Edge.
            </p>
          )}

          <div className={styles.recordBtnWrap} style={{ marginTop: "0.5rem" }}>
            <button
              onMouseDown={handlePressStart}
              onTouchStart={handlePressStart}
              onTouchEnd={handlePressEnd}
              disabled={!isSupported || isProcessing}
              className={`${styles.recordBtn} ${recordBtnClass}`}
            >
              {isProcessing ? (
                <FontAwesomeIcon icon={faSpinner} className={styles.spinner} />
              ) : (
                <FontAwesomeIcon icon={faMicrophone} />
              )}
              {isProcessing
                ? "Processing\u2026"
                : isListening
                  ? "Recording\u2026"
                  : "Hold to record"}
            </button>
            {!isProcessing && !isListening && lastCorrect === null && (
              <p className={styles.recordHint}>
                Press and hold, then release when done
              </p>
            )}
          </div>

          {error && (
            <p
              className={`${styles.alert} ${styles.alertError}`}
              style={{ marginTop: "0.75rem" }}
            >
              {error}
            </p>
          )}
        </div>
      )}

      {/* Feedback */}
      {lastCorrect !== null && !isProcessing && (
        <div
          className={`${styles.alert} ${lastCorrect ? styles.feedbackCorrect : styles.feedbackWrong}`}
        >
          {lastCorrect
            ? step === "writing"
              ? "Correct! Moving to speaking\u2026"
              : "Correct!"
            : failed
              ? "Back to practice\u2026"
              : "Not quite \u2014 try again"}
        </div>
      )}

      {/* Wrong words for speaking */}
      {step === "speaking" && speakWords.length > 0 && !lastCorrect && (
        <div className={styles.wordList}>
          {speakWords
            .filter((w) => !w.correct)
            .map((w, i) => (
              <WordResult key={i} word={w} />
            ))}
        </div>
      )}
    </div>
  );
}
