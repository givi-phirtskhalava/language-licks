"use client";

import { useState } from "react";
import { z } from "zod";
import Button from "@atoms/Button";
import Turnstile from "@atoms/Turnstile";
import style from "./page.module.css";

const emailSchema = z.email("Please enter a valid email address");

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [text, setText] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !text.trim()) {
      setError("All fields are required");
      return;
    }

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    if (turnstileEnabled && !turnstileToken) {
      setError("Please complete the captcha");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, text, turnstileToken }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to send message");
        return;
      }

      setSent(true);
      setName("");
      setEmail("");
      setText("");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={style.container}>
      <div className={style.content}>
        <h1 className={style.title}>Contact</h1>
        <p className={style.hint}>
          Have a question or feedback? Send us a message and we&apos;ll get back to you.
        </p>

        {sent && (
          <div className={style.form}>
            <p className={style.success}>
              Thanks! Your message has been sent.
            </p>
          </div>
        )}

        {!sent && (
          <form onSubmit={handleSubmit} className={style.form}>
            <label htmlFor="name" className={style.label}>
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={style.input}
              required
            />

            <label htmlFor="email" className={style.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={style.input}
              required
            />

            <label htmlFor="text" className={style.label}>
              Message
            </label>
            <textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className={style.textarea}
              required
            />

            {turnstileEnabled && (
              <Turnstile
                onVerify={setTurnstileToken}
                onExpire={() => setTurnstileToken("")}
              />
            )}

            {error && <p className={style.error}>{error}</p>}

            <Button type="submit" loading={loading}>
              Send message
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
