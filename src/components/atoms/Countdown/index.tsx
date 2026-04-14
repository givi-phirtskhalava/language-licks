"use client";

import { useState, useEffect } from "react";
import formatTimeUntil from "@lib/util/formatTimeUntil";
import styles from "./Countdown.module.css";

interface Props {
  targetTime: number;
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
