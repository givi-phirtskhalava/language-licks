import classNames from "classnames";
import { MAX_MASTERY_LEVEL } from "@lib/useProgress";
import styles from "./MasteryBar.module.css";

interface Props {
  level: number;
}

export default function MasteryBar({ level }: Props) {
  return (
    <div className={styles.bar}>
      {Array.from({ length: MAX_MASTERY_LEVEL }, (_, i) => (
        <span
          key={i}
          className={classNames(styles.segment, i < level && styles.filled)}
        />
      ))}
    </div>
  );
}
