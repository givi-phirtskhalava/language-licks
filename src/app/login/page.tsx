"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import Button from "@atoms/Button";
import useLanguage from "@lib/useLanguage";
import usePaddle from "@lib/hooks/usePaddle";
import { syncAndClear } from "@lib/useProgress";
import style from "./Login.module.css";

const emailSchema = z.email("Please enter a valid email address");

type TStep = "email" | "code";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const checkout = searchParams.get("checkout") === "true";
  const { language } = useLanguage();
  const { openCheckout } = usePaddle();

  const [step, setStep] = useState<TStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");
    setError("");

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setEmailError(result.error.issues[0].message);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to send code");
        return;
      }

      setStep("code");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed");
        return;
      }

      await syncAndClear(language);
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });

      if (checkout && data.user?.id) {
        openCheckout(
          email,
          data.user.id,
          () => {
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
            router.push(redirect);
          },
          () => {
            router.push(redirect);
          }
        );
        return;
      }

      router.push(redirect);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={style.container}>
      <div className={style.card}>
        <h1 className={style.title}>Sign in / Sign up</h1>
        {step === "email" && (
          <p className={style.hint}>
            No password required, we'll email you a login code.
          </p>
        )}

        {step === "email" && (
          <form onSubmit={handleSendCode} className={style.form}>
            <label htmlFor="email" className={style.label}>
              Enter your email address
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              placeholder="you@example.com"
              className={style.input}
              required
              autoFocus
            />
            {emailError && <p className={style.error}>{emailError}</p>}
            {error && <p className={style.error}>{error}</p>}
            <Button type="submit" loading={loading}>
              Send code
            </Button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleVerifyCode} className={style.form}>
            <p className={style.hint}>
              We sent a 6-digit code to <strong>{email}</strong>
            </p>
            <label htmlFor="code" className={style.label}>
              Verification code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              className={style.input}
              maxLength={6}
              required
              autoFocus
            />
            {error && <p className={style.error}>{error}</p>}
            <Button type="submit" loading={loading}>
              Verify
            </Button>
            <Button
              theme="ghost"
              onClick={() => {
                setStep("email");
                setCode("");
                setError("");
              }}
            >
              Use a different email
            </Button>
          </form>
        )}


      </div>
    </div>
  );
}
