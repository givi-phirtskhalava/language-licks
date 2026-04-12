import styles from "./StreakDots.module.css";

interface Props {
  streak: number;
  goal: number;
}

export default function StreakDots({ streak, goal }: Props) {
  return (
    <div className={styles.dots}>
      {Array.from({ length: goal }, (_, i) => (
        <span
          key={i}
          className={`${styles.dot} ${i < streak && styles.dotActive}`}
        />
      ))}
    </div>
  );
}
