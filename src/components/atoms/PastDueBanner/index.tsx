"use client";

import { useRouter } from "next/navigation";
import useAuth from "@lib/hooks/useAuth";
import styles from "./PastDueBanner.module.css";

export default function PastDueBanner() {
  const router = useRouter();
  const { user } = useAuth();

  if (user?.subscriptionStatus !== "past_due") return null;

  return (
    <div className={styles.banner}>
      <p className={styles.message}>
        Your payment was declined. Please update your payment method.
      </p>
      <button className={styles.link} onClick={() => router.push("/profile")}>
        Manage billing
      </button>
    </div>
  );
}
