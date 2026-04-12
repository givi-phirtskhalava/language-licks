import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";

const GOAL = 5;

interface UseStreakReturn {
  streak: number;
  goal: number;
  hit: () => void;
  miss: () => void;
}

export default function useStreak(readyMessage: string): UseStreakReturn {
  const [streak, setStreak] = useState(0);
  const firedRef = useRef(false);

  const hit = useCallback(() => {
    setStreak((prev) => {
      const next = prev + 1;
      if (next >= GOAL && !firedRef.current) {
        firedRef.current = true;
        setTimeout(() => toast.success(readyMessage, { duration: 4000 }), 600);
      }
      return next;
    });
  }, [readyMessage]);

  const miss = useCallback(() => {
    setStreak(0);
    firedRef.current = false;
  }, []);

  return { streak, goal: GOAL, hit, miss };
}
