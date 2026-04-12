"use client";

import { useEffect, useRef } from "react";
import useAuth from "@lib/hooks/useAuth";
import useLanguage from "@lib/useLanguage";
import { hydrateFromApi, clearDbMode } from "@lib/useProgress";

export default function ProgressSync() {
  const { isLoggedIn, isLoading } = useAuth();
  const { language } = useLanguage();
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    if (isLoggedIn && !hydratedRef.current) {
      hydratedRef.current = true;
      hydrateFromApi(language);
    }

    if (!isLoggedIn && hydratedRef.current) {
      hydratedRef.current = false;
      clearDbMode();
    }
  }, [isLoggedIn, isLoading, language]);

  return null;
}
