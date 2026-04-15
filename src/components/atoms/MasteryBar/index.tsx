import { MAX_MASTERY_LEVEL } from "@lib/useProgress";
import styles from "./MasteryBar.module.css";

interface Props {
  level: number;
}

function getLevelColor(level: number): string {
  const clamped = Math.max(1, level);
  const t = (clamped - 1) / (MAX_MASTERY_LEVEL - 1);
  const h = 210 + (140 - 210) * t;
  const s = 60 + (50 - 60) * t;
  const l = 92 + (85 - 92) * t;
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export default function MasteryBar({ level }: Props) {
  return (
    <span
      className={styles.badge}
      style={{ background: getLevelColor(level) }}
    >
      lvl.{level}
    </span>
  );
}
