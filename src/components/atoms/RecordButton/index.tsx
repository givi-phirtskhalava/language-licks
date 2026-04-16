import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import Spinner from "@atoms/Spinner";
import styles from "./RecordButton.module.css";

interface Props {
  isListening: boolean;
  isProcessing: boolean;
  error: string | null;
  onToggle: () => void;
  credits?: number | null;
}

export default function RecordButton({
  isListening,
  isProcessing,
  error,
  onToggle,
  credits,
}: Props) {
  const btnClass = isProcessing
    ? styles.btnProcessing
    : isListening
      ? styles.btnListening
      : styles.btnIdle;

  const noCredits = credits !== undefined && credits !== null && credits <= 0;

  return (
    <>
      <div className={styles.wrap}>
        <button
          onClick={onToggle}
          disabled={isProcessing || noCredits}
          className={`${styles.btn} ${btnClass}`}
        >
          {isProcessing ? (
            <span className={styles.spinnerWrap}>
              <Spinner color="white" />
            </span>
          ) : (
            <FontAwesomeIcon icon={faMicrophone} />
          )}
          {isProcessing
            ? "Processing\u2026"
            : isListening
              ? "Click to stop"
              : "Record"}
        </button>

        {credits !== undefined && credits !== null && (
          <p className={styles.credits}>
            {credits} {credits === 1 ? "recording" : "recordings"} left
          </p>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </>
  );
}
