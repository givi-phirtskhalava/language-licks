import { useCallback, useRef, useState } from "react";

interface UseBestTimeReturn {
  elapsed: number | null;
  bestTime: number | null;
  startTimer: () => void;
  stopTimer: () => number | null;
  resetTimer: () => void;
}

export default function useBestTime(): UseBestTimeReturn {
  const startRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);

  const startTimer = useCallback(() => {
    if (startRef.current === null) {
      startRef.current = Date.now();
    }
  }, []);

  const stopTimer = useCallback(() => {
    if (startRef.current === null) return null;
    const time = (Date.now() - startRef.current) / 1000;
    startRef.current = null;
    setElapsed(time);
    setBestTime((prev) => (prev === null ? time : Math.min(prev, time)));
    return time;
  }, []);

  const resetTimer = useCallback(() => {
    startRef.current = null;
    setElapsed(null);
  }, []);

  return { elapsed, bestTime, startTimer, stopTimer, resetTimer };
}
