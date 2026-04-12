import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import Spinner from "@atoms/Spinner";
import styles from "./RecordButton.module.css";

interface Props {
  isListening: boolean;
  isProcessing: boolean;
  isSupported: boolean;
  error: string | null;
  onToggle: () => void;
  showHint?: boolean;
}

export default function RecordButton({
  isListening,
  isProcessing,
  isSupported,
  error,
  onToggle,
  showHint,
}: Props) {
  const btnClass = isProcessing
    ? styles.btnProcessing
    : isListening
      ? styles.btnListening
      : styles.btnIdle;

  return (
    <>
      {!isSupported && (
        <p className={styles.unsupported}>
          Speech recognition is not supported in your browser. Try Chrome or
          Edge.
        </p>
      )}

      <div className={styles.wrap}>
        <button
          onClick={onToggle}
          disabled={!isSupported || isProcessing}
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
        {showHint && !isProcessing && !isListening && (
          <p className={styles.hint}>Click to start, click again to stop</p>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </>
  );
}
