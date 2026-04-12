"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faSpinner,
  faPen,
  faEye,
  faEyeSlash,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { compareWords, WordComparison } from "@/lib/compareText";
import AudioButton from "@/components/organisms/LanguageCard/AudioButton";
import WordResult from "@/components/organisms/LanguageCard/WordResult";
import StreakDots from "@/components/organisms/LanguageCard/StreakDots";
import useStreak from "@/components/organisms/LanguageCard/useStreak";
import useBestTime from "@/components/organisms/LanguageCard/useBestTime";
import { Lesson } from "@lib/types";
import styles from "./Practice.module.css";

interface Props {
  lesson: Lesson;
  onReady: () => void;
}

type WriteWordStatus = "correct" | "warning" | "error" | "missing";

interface WriteWordResult {
  expected: string;
  actual: string | null;
  status: WriteWordStatus;
}

function stripPunctuation(word: string): string {
  return word.replace(/[^a-zA-ZàâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ']/g, "");
}

function compareWriting(expected: string, actual: string): WriteWordResult[] {
  const expTrimmed = expected.replace(/[.,!?;:…]+$/, "");
  const actTrimmed = actual.replace(/[.,!?;:…]+$/, "");

  const expWords = expTrimmed.split(/\s+/).filter(Boolean);
  const actWords = actTrimmed.split(/\s+/).filter(Boolean);

  const results: WriteWordResult[] = [];
  const len = Math.max(expWords.length, actWords.length);

  for (let i = 0; i < len; i++) {
    const exp = expWords[i];
    const act = actWords[i];

    if (!exp) continue;

    if (!act) {
      results.push({ expected: exp, actual: null, status: "missing" });
      continue;
    }

    if (exp === act) {
      results.push({ expected: exp, actual: act, status: "correct" });
      continue;
    }

    const expStripped = stripPunctuation(exp);
    const actStripped = stripPunctuation(act);

    if (expStripped === actStripped) {
      results.push({ expected: exp, actual: act, status: "warning" });
      continue;
    }

    if (expStripped.toLowerCase() === actStripped.toLowerCase()) {
      results.push({ expected: exp, actual: act, status: "warning" });
      continue;
    }

    results.push({ expected: exp, actual: act, status: "error" });
  }

  return results;
}

export default function Practice({ lesson, onReady }: Props) {
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [writeResult, setWriteResult] = useState<WriteWordResult[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const writeStreak = useStreak("I think you\u2019re ready for the writing test! \u270D\uFE0F");
  const writeTimer = useBestTime();

  const speakStreak = useStreak("I think you\u2019re ready for the speaking test! \uD83C\uDF99\uFE0F");
  const speakTimer = useBestTime();

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

  const [speakResult, setSpeakResult] = useState<{
    correct: boolean;
    words: WordComparison[];
  } | null>(null);

  // Check speech result
  const processedResultId = useRef(0);
  useEffect(() => {
    if (resultId > processedResultId.current && transcript) {
      processedResultId.current = resultId;
      const comparison = compareWords(lesson.sentence, transcript);
      const passed = comparison.score === 1;
      setSpeakResult({ correct: passed, words: comparison.words });
      if (passed) {
        speakTimer.stopTimer();
        speakStreak.hit();
      } else {
        speakTimer.resetTimer();
        speakStreak.miss();
      }
    }
  }, [resultId, transcript, lesson.sentence, speakTimer, speakStreak]);

  function handleWriteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const results = compareWriting(lesson.sentence, input);
    setWriteResult(results);
    const hasErrors = results.some((r) => r.status === "error" || r.status === "missing");
    const onlyWarningsOrCorrect = !hasErrors;

    setInput("");

    if (onlyWarningsOrCorrect) {
      writeTimer.stopTimer();
      writeStreak.hit();
    } else {
      writeTimer.resetTimer();
      writeStreak.miss();
    }
  }

  function handleWriteRetry() {
    setInput("");
    setWriteResult(null);
    writeTimer.resetTimer();
    inputRef.current?.focus();
  }

  const writeHasErrors = writeResult?.some((r) => r.status === "error" || r.status === "missing") ?? false;
  const writeHasWarnings = writeResult?.some((r) => r.status === "warning") ?? false;
  const writeIsPass = writeResult !== null && !writeHasErrors;

  async function handlePressStart() {
    if (isProcessing) return;
    setSpeakResult(null);
    speakTimer.startTimer();
    const started = await start();
    if (!started) {
      toast.error(
        "Microphone access is blocked. Please allow it in your browser settingstyles.",
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

  const inputStateClass =
    writeResult === null
      ? ""
      : writeIsPass && !writeHasWarnings
        ? styles.writingInputCorrect
        : writeIsPass
          ? styles.writingInputWarning
          : styles.writingInputWrong;

  return (
    <div className={styles.body}>
      {/* Sentence + audio — blurred by default */}
      <div className={`${styles.topSection} ${!revealed && styles.topSectionBlurred}`}>
        <div className={styles.sentenceWrap}>
          <p className={styles.sentence}>{lesson.sentence}</p>
          <p className={styles.translation}>
            {"\u201C" + lesson.translation + "\u201D"}
          </p>
        </div>

        <div className={styles.center}>
          <AudioButton src={lesson.audio} />
        </div>
      </div>

      <div className={styles.center}>
        <button
          className={styles.revealBtn}
          onClick={() => setRevealed((prev) => !prev)}
        >
          <FontAwesomeIcon icon={revealed ? faEyeSlash : faEye} />
        </button>
      </div>

      {/* Writing practice */}
      <div>
        <div className={styles.sectionHeader}>
          <p className={styles.sectionLabel}>Writing Practice</p>
          <div className={styles.sectionMeta}>
            <span className={styles.bestTime}>
              Best: {writeTimer.bestTime !== null ? writeTimer.bestTime.toFixed(1) + "s" : "\u2014"}
            </span>
            <StreakDots streak={writeStreak.streak} goal={writeStreak.goal} />
          </div>
        </div>

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
              if (writeResult !== null) setWriteResult(null);
              writeTimer.startTimer();
            }}
            placeholder="Type the sentence here\u2026"
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

        {writeResult !== null && !writeHasErrors && !writeHasWarnings && (
          <div
            className={`${styles.alert} ${styles.feedbackCorrect}`}
            style={{ marginTop: "0.75rem" }}
          >
            <span>Correct!</span>
            {writeTimer.elapsed !== null && (
              <span className={styles.timeInfo}>
                {writeTimer.elapsed.toFixed(1)}s
              </span>
            )}
            {writeTimer.bestTime !== null && writeTimer.elapsed === writeTimer.bestTime && (
              <span className={styles.newBest}>&nbsp;New best!</span>
            )}
          </div>
        )}

        {writeResult !== null && (writeHasErrors || writeHasWarnings) && (
          <div style={{ marginTop: "0.75rem" }}>
            <div className={styles.writeWordList}>
              {writeResult.map((r, i) => (
                <span
                  key={i}
                  className={
                    r.status === "correct"
                      ? styles.writeWordCorrect
                      : r.status === "warning"
                        ? styles.writeWordWarning
                        : styles.writeWordError
                  }
                >
                  {r.expected}
                </span>
              ))}
            </div>

            <button
              type="button"
              className={styles.retryBtn}
              onClick={handleWriteRetry}
            >
              <FontAwesomeIcon icon={faRotateLeft} style={{ marginRight: "0.5rem" }} />
              Try again
            </button>
          </div>
        )}
      </div>

      {/* Speaking practice */}
      <div>
        <div className={styles.sectionHeader}>
          <p className={styles.sectionLabel}>Speaking Practice</p>
          <div className={styles.sectionMeta}>
            <span className={styles.bestTime}>
              Best: {speakTimer.bestTime !== null ? speakTimer.bestTime.toFixed(1) + "s" : "\u2014"}
            </span>
            <StreakDots streak={speakStreak.streak} goal={speakStreak.goal} />
          </div>
        </div>

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
          {!isProcessing && !isListening && !speakResult && (
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

        {speakResult && !isProcessing && (
          <div
            className={`${styles.alert} ${speakResult.correct ? styles.feedbackCorrect : styles.feedbackWrong}`}
            style={{ marginTop: "0.75rem" }}
          >
            <span>{speakResult.correct ? "Correct!" : "Not quite \u2014 try again"}</span>
            {speakResult.correct && speakTimer.elapsed !== null && (
              <span className={styles.timeInfo}>
                {speakTimer.elapsed.toFixed(1)}s
              </span>
            )}
            {speakResult.correct && speakTimer.bestTime !== null && speakTimer.elapsed === speakTimer.bestTime && (
              <span className={styles.newBest}>&nbsp;New best!</span>
            )}
          </div>
        )}

        {speakResult && !speakResult.correct && (
          <div className={styles.wordList} style={{ marginTop: "0.5rem" }}>
            {speakResult.words
              .filter((w) => !w.correct)
              .map((w, i) => (
                <WordResult key={i} word={w} />
              ))}
          </div>
        )}
      </div>

      <button onClick={onReady} className={styles.primaryBtn}>
        {"I\u2019m ready \u2014 test me"}
      </button>
    </div>
  );
}
