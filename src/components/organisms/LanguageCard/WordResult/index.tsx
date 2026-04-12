import { IWordComparison } from "@/lib/compareText";
import styles from "./WordResult.module.css";

interface Props {
  word: IWordComparison;
}

export default function WordResult({ word }: Props) {
  const title = word.correct
    ? "Correct!"
    : 'Expected "' +
      word.expected +
      '", heard "' +
      (word.actual || "missing") +
      '"';

  return (
    <span
      className={`${styles.wordBadge} ${word.correct ? styles.wordCorrect : styles.wordWrong}`}
      title={title}
    >
      {word.expected}
      {!word.correct && word.actual && (
        <span className={styles.wordActual}>
          {"("}
          {word.actual}
          {")"}
        </span>
      )}
      {!word.correct && !word.actual && (
        <span className={styles.wordActual}>{"(missing)"}</span>
      )}
    </span>
  );
}
