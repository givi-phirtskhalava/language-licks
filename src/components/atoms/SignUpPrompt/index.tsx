"use client";

import { useRouter } from "next/navigation";
import Button from "@atoms/Button";
import useAuth from "@lib/hooks/useAuth";
import styles from "./SignUpPrompt.module.css";

interface Props {
  message: string;
  onAction?: () => void;
}

export default function SignUpPrompt({ message, onAction }: Props) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  function handleClick() {
    if (onAction) {
      onAction();
      return;
    }
    router.push("/login?checkout=true");
  }

  return (
    <div className={styles.container}>
      <p className={styles.message}>{message}</p>
      <Button onClick={handleClick}>
        {isLoggedIn ? "Go Premium \u2014 €10/mo" : "Sign up for €10/mo"}
      </Button>
    </div>
  );
}
