import StreakDots from "@/components/organisms/LanguageCard/StreakDots";
import style from "./SectionHeader.module.css";

interface Props {
  bestTime: number | null;
  streak: number;
  streakGoal: number;
}

export default function SectionHeader({ bestTime, streak, streakGoal }: Props) {
  return (
    <div className={style.container}>
      <div className={style.meta}>
        {/* <span className={style.bestTime}>
          Best Time {bestTime !== null ? bestTime.toFixed(1) + "s" : "..."}
        </span> */}
        <StreakDots streak={streak} goal={streakGoal} />
      </div>
    </div>
  );
}
