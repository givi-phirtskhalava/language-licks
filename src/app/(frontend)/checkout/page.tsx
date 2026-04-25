"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CheckoutEventNames } from "@paddle/paddle-js";
import useAuth from "@lib/hooks/useAuth";
import usePaddle from "@lib/hooks/usePaddle";
import style from "./Checkout.module.css";

const FRAME_CLASS = "checkout-frame";

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoggedIn, isPremium, isLoading } = useAuth();
  const { paddle } = usePaddle();

  useEffect(() => {
    if (isLoading) return;

    if (!isLoggedIn) {
      router.replace("/login?checkout=true");
      return;
    }

    if (isPremium) {
      router.replace("/profile");
    }
  }, [isLoading, isLoggedIn, isPremium, router]);

  useEffect(() => {
    if (!paddle || !user || isPremium) return;

    const theme =
      document.documentElement.dataset.theme === "dark" ? "dark" : "light";

    paddle.Checkout.open({
      items: [{ priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID! }],
      customer: { email: user.email },
      customData: { userId: String(user.id) },
      settings: {
        displayMode: "inline",
        variant: "one-page",
        theme,
        frameTarget: FRAME_CLASS,
        frameInitialHeight: 450,
        frameStyle:
          "width: 100%; min-width: 312px; background-color: transparent; border: none;",
      },
    });

    paddle.Update({
      eventCallback: (event) => {
        if (event.name === CheckoutEventNames.CHECKOUT_COMPLETED) {
          waitForPremium().then(() => {
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
            router.push("/lessons");
          });
        }
      },
    });
  }, [paddle, user, isPremium, queryClient, router]);

  return (
    <main className={style.container}>
      <div className={style.content}>
        <div className={style.summary}>
          <p className={style.plan}></p>
          <p className={style.price}>
            <span className={style.priceAmount}>€10</span>
            <span className={style.priceUnit}>/ month</span>
          </p>
        </div>

        <div className={FRAME_CLASS}></div>
      </div>
    </main>
  );
}

async function waitForPremium(
  maxAttempts = 10,
  intervalMs = 2000
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch("/api/auth/me");
    if (res.ok) {
      const data = await res.json();
      if (data.user?.isPremium) return true;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}
