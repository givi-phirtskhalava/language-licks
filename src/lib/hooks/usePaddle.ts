"use client";

import { useEffect, useRef, useState } from "react";
import {
  initializePaddle,
  type Paddle,
  CheckoutEventNames,
} from "@paddle/paddle-js";

async function waitForPremium(maxAttempts = 10, intervalMs = 2000): Promise<boolean> {
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

export default function usePaddle() {
  const [paddle, setPaddle] = useState<Paddle | undefined>();
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    initializePaddle({
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
      environment: process.env.NEXT_PUBLIC_PADDLE_ENV as
        | "sandbox"
        | "production",
    }).then((instance) => {
      if (instance) setPaddle(instance);
    });
  }, []);

  function openCheckout(
    email: string,
    userId: number,
    onComplete?: () => void,
    onClose?: () => void
  ) {
    if (!paddle) return;

    paddle.Checkout.open({
      items: [{ priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID! }],
      customer: { email },
      customData: { userId: String(userId) },
      settings: { displayMode: "overlay" },
    });

    paddle.Update({
      eventCallback: (event) => {
        if (event.name === CheckoutEventNames.CHECKOUT_COMPLETED) {
          waitForPremium().then(() => {
            onComplete?.();
          });
        }
        if (event.name === CheckoutEventNames.CHECKOUT_CLOSED) {
          onClose?.();
        }
      },
    });
  }

  return { paddle, openCheckout };
}
