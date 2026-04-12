"use client";

import { useRouter } from "next/navigation";
import Button from "@atoms/Button";
import styles from "./SignUpPrompt.module.css";

interface Props {
  message: string;
}

export default function SignUpPrompt({ message }: Props) {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <p className={styles.message}>{message}</p>
      <Button onClick={() => router.push("/login")}>Sign up free</Button>
    </div>
  );
}
