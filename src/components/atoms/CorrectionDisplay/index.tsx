import { IWriteWordResult } from "@/components/organisms/LanguageCard/hooks/useWritingCheck";
import styles from "./CorrectionDisplay.module.css";

interface Props {
  words: IWriteWordResult[];
}

export default function CorrectionDisplay({ words }: Props) {
  return (
    <div className={styles.wordList}>
      {words.map((r, i) => (
        <span key={i} className={styles.wordGroup}>
          {r.status === "correct" && (
            <span className={styles.wordCorrect}>{r.expected}</span>
          )}
          {r.status === "warning" && (
            <span className={styles.wordWarning}>{r.expected}</span>
          )}
          {r.status === "error" && (
            <>
              <span className={styles.wordStruck}>{r.actual}</span>
              <span className={styles.wordCorrection}>{r.expected}</span>
            </>
          )}
          {r.status === "missing" && (
            <span className={styles.wordCorrection}>{r.expected}</span>
          )}
          {r.status === "extra" && (
            <span className={styles.wordStruck}>{r.actual}</span>
          )}
        </span>
      ))}
    </div>
  );
}
