import { useCallback, useRef, useState } from "react";

interface Props {
  initialBestTime?: number | null;
  onBestTimeChange?: (time: number) => void;
}

interface UseBestTimeReturn {
  elapsed: number | null;
  bestTime: number | null;
  startTimer: () => void;
  stopTimer: () => number | null;
  resetTimer: () => void;
}

export default function useBestTime({
  initialBestTime = null,
  onBestTimeChange,
}: Props = {}): UseBestTimeReturn {
  const startRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(initialBestTime);

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
    setBestTime((prev) => {
      const newBest = prev === null ? time : Math.min(prev, time);
      if (newBest === time) {
        onBestTimeChange?.(time);
      }
      return newBest;
    });
    return time;
  }, [onBestTimeChange]);

  const resetTimer = useCallback(() => {
    startRef.current = null;
    setElapsed(null);
  }, []);

  return { elapsed, bestTime, startTimer, stopTimer, resetTimer };
}
