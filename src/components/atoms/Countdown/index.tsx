"use client";

import { useState, useEffect } from "react";
import styles from "./Countdown.module.css";

interface Props {
  targetTime: number;
}

function formatTimeUntil(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 10) return `${minutes}m ${seconds}s`;
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function Countdown({ targetTime }: Props) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const remaining = targetTime - now;
  if (remaining <= 0) return null;

  return <span className={styles.countdown}>{formatTimeUntil(remaining)}</span>;
}
