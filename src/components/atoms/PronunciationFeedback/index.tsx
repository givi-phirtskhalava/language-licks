import type { IAzureWordScore } from "@lib/types";
import styles from "./PronunciationFeedback.module.css";

interface Props {
  accuracyScore: number;
  wordScores: IAzureWordScore[];
}

function scoreClass(score: number): string {
  if (isNaN(score)) return styles.fair;
  if (score >= 80) return styles.good;
  if (score >= 60) return styles.fair;
  return styles.poor;
}

export default function PronunciationFeedback({
  accuracyScore,
  wordScores,
}: Props) {
  // Only show words with pronunciation below 80%
  const weak = wordScores.filter((w) => w.accuracyScore < 80);
  const hasScore = !isNaN(accuracyScore) && accuracyScore > 0;

  return (
    <div className={styles.container}>
      {hasScore && (
        <p className={styles.overallScore}>
          Overall pronunciation score:{" "}
          <span className={`${styles.scoreValue} ${scoreClass(accuracyScore)}`}>
            {Math.round(accuracyScore)}%
          </span>
        </p>
      )}

      {weak.length > 0 && (
        <div className={styles.wordFeedback}>
          <p className={styles.wordFeedbackLabel}>Words to work on:</p>
          <div className={styles.wordList}>
            {weak.map((w, i) => (
              <span key={i} className={styles.wordChip}>
                <span className={styles.wordText}>{w.word}</span>
                <span className={`${styles.wordScore} ${scoreClass(w.accuracyScore)}`}>
                  {Math.round(w.accuracyScore)}%
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
