"use client";

import { useEffect, useRef } from "react";
import GUI from "lil-gui";
import { useQueryClient } from "@tanstack/react-query";
import useLanguage from "@lib/useLanguage";
import useAuth from "@lib/hooks/useAuth";
import { devAdvanceDay, devResetAll } from "@lib/useProgress";

export default function DevGui() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const { isLoggedIn } = useAuth();

  const langRef = useRef(language);
  const loggedInRef = useRef(isLoggedIn);

  useEffect(
    function syncLangRef() {
      langRef.current = language;
    },
    [language]
  );

  useEffect(
    function syncLoggedInRef() {
      loggedInRef.current = isLoggedIn;
    },
    [isLoggedIn]
  );

  useEffect(function mountGui() {
    if (process.env.NODE_ENV !== "development") return;

    const gui = new GUI({ title: "Dev", width: 240 });
    gui.domElement.style.setProperty("z-index", "9999");
    gui.domElement.style.setProperty("top", "auto");
    gui.domElement.style.setProperty("bottom", "0");
    gui.domElement.style.setProperty("right", "0");

    const actions = {
      togglePremium: async function togglePremium() {
        if (!loggedInRef.current) {
          console.warn("[DevGui] togglePremium: log in first");
          return;
        }
        try {
          const res = await fetch("/api/billing/dev-toggle", { method: "POST" });
          if (!res.ok) {
            console.error("[DevGui] togglePremium failed:", await res.text());
            return;
          }
          queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        } catch (err) {
          console.error("[DevGui] togglePremium error:", err);
        }
      },
      skipDay: function skipDay() {
        devAdvanceDay();
      },
      resetProgress: async function resetProgress() {
        const lang = langRef.current;
        if (!confirm(`Reset all ${lang} progress and daily activity?`)) return;
        try {
          await devResetAll(lang);
        } catch (err) {
          console.error("[DevGui] resetProgress error:", err);
        }
      },
      passWriting: function passWriting() {
        window.dispatchEvent(new CustomEvent("dev:pass-writing"));
      },
      passSpeaking: function passSpeaking() {
        window.dispatchEvent(new CustomEvent("dev:pass-speaking"));
      },
    };

    gui.add(actions, "togglePremium").name("Toggle premium");
    gui.add(actions, "skipDay").name("Skip day");
    gui.add(actions, "resetProgress").name("Reset progress");

    const lessonFolder = gui.addFolder("Current lesson");
    lessonFolder.add(actions, "passWriting").name("Pass writing test");
    lessonFolder.add(actions, "passSpeaking").name("Pass speaking test");
    lessonFolder.open();

    return function cleanup() {
      gui.destroy();
    };
  }, [queryClient]);

  return null;
}
