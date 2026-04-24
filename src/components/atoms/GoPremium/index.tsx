"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import Button from "@atoms/Button";
import useAuth from "@lib/hooks/useAuth";
import usePaddle from "@lib/hooks/usePaddle";
import styles from "./GoPremium.module.css";

const FEATURES = [
  "All lessons in every language",
  "Spaced repetition reviews for all lessons",
  "Speaking practice with voice recognition",
  "Audio tests and review mode",
  "Progress saved to your account",
];

export default function GoPremium() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const { openCheckout } = usePaddle();
  const queryClient = useQueryClient();

  function handleSubscribe() {
    if (!isLoggedIn) {
      router.push("/login?checkout=true");
      return;
    }
    if (!user) return;
    openCheckout(user.email, user.id, () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <p className={styles.title}>Get full access</p>
        <p className={styles.price}>
          <span className={styles.priceAmount}>€10</span>
          <span className={styles.priceUnit}>/ month</span>
        </p>
      </div>

      <ul className={styles.features}>
        {FEATURES.map((feature) => (
          <li key={feature} className={styles.feature}>
            <span className={styles.checkIcon}>
              <FontAwesomeIcon icon={faCheck} />
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button onClick={handleSubscribe}>
        {isLoggedIn ? "Subscribe" : "Sign up & subscribe"}
      </Button>
    </div>
  );
}
