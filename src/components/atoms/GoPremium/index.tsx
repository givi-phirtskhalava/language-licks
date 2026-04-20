"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Button from "@atoms/Button";
import useAuth from "@lib/hooks/useAuth";
import usePaddle from "@lib/hooks/usePaddle";
import styles from "./GoPremium.module.css";

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
      <p className={styles.title}>Get full access</p>
      <p className={styles.price}>$10 / month</p>
      <ul className={styles.features}>
        <li>All lessons in every language</li>
        <li>Spaced repetition reviews for all lessons</li>
        <li>Speaking practice with voice recognition</li>
        <li>Audio tests and review mode</li>
        <li>Progress saved to your account</li>
      </ul>
      <Button onClick={handleSubscribe}>
        {isLoggedIn ? "Subscribe" : "Sign up \u0026 subscribe"}
      </Button>
    </div>
  );
}
