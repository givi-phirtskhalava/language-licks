import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";

const GOAL = 5;

interface Props {
  readyMessage: string;
  initialStreak?: number;
  onStreakChange?: (streak: number) => void;
}

interface UseStreakReturn {
  streak: number;
  goal: number;
  hit: () => void;
  miss: () => void;
}

export default function useStreak({
  readyMessage,
  initialStreak = 0,
  onStreakChange,
}: Props): UseStreakReturn {
  const [streak, setStreak] = useState(initialStreak);
  const firedRef = useRef(initialStreak >= GOAL);

  const hit = useCallback(() => {
    setStreak((prev) => {
      const next = prev + 1;
      if (next >= GOAL && !firedRef.current) {
        firedRef.current = true;
        setTimeout(() => toast.success(readyMessage, { duration: 4000 }), 600);
      }
      onStreakChange?.(next);
      return next;
    });
  }, [readyMessage, onStreakChange]);

  const miss = useCallback(() => {
    setStreak(0);
    firedRef.current = false;
    onStreakChange?.(0);
  }, [onStreakChange]);

  return { streak, goal: GOAL, hit, miss };
}
