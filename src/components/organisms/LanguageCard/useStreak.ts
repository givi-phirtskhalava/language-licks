import { useCallback, useEffect, useRef, useState } from "react";

const GOAL = 1;

interface Props {
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
  initialStreak = 0,
  onStreakChange,
}: Props): UseStreakReturn {
  const [streak, setStreak] = useState(initialStreak);
  const isInitialRef = useRef(true);

  useEffect(() => {
    if (isInitialRef.current) {
      isInitialRef.current = false;
      return;
    }
    onStreakChange?.(streak);
  }, [streak]);

  const hit = useCallback(() => {
    setStreak((prev) => prev + 1);
  }, []);

  const miss = useCallback(() => {}, []);

  return { streak, goal: GOAL, hit, miss };
}
