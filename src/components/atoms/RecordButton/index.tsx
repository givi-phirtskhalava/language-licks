import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import Spinner from "@atoms/Spinner";
import styles from "./RecordButton.module.css";

interface Props {
  isListening: boolean;
  isProcessing: boolean;
  error: string | null;
  onToggle: () => void;
}

export default function RecordButton({
  isListening,
  isProcessing,
  error,
  onToggle,
}: Props) {
  const btnClass = isProcessing
    ? styles.btnProcessing
    : isListening
      ? styles.btnListening
      : styles.btnIdle;

  return (
    <>
      <div className={styles.wrap}>
        <button
          onClick={onToggle}
          disabled={isProcessing}
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
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </>
  );
}
