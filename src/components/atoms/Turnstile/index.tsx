"use client";

import { useEffect, useRef } from "react";

interface ITurnstileWindow extends Window {
  turnstile?: {
    render: (
      el: HTMLElement,
      options: {
        sitekey: string;
        callback: (token: string) => void;
        "error-callback"?: () => void;
        "expired-callback"?: () => void;
        theme?: "light" | "dark" | "auto";
      }
    ) => string;
    remove: (widgetId: string) => void;
    reset: (widgetId: string) => void;
  };
  onTurnstileLoad?: () => void;
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit";

interface Props {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

export default function Turnstile({ onVerify, onExpire }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
  }, [onVerify, onExpire]);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey || !containerRef.current) return;

    const w = window as ITurnstileWindow;

    function render() {
      if (!w.turnstile || !containerRef.current) return;
      widgetIdRef.current = w.turnstile.render(containerRef.current, {
        sitekey: siteKey!,
        callback: (token: string) => onVerifyRef.current(token),
        "expired-callback": () => onExpireRef.current?.(),
        "error-callback": () => onExpireRef.current?.(),
      });
    }

    if (w.turnstile) {
      render();
    } else {
      w.onTurnstileLoad = render;
      if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
        const script = document.createElement("script");
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }

    return () => {
      if (widgetIdRef.current && w.turnstile) {
        try {
          w.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} />;
}
