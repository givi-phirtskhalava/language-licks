"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import style from "./NavigationProgress.module.css";

export default function NavigationProgress() {
  const pathname = usePathname();
  const [navigating, setNavigating] = useState(false);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href === prevPathname.current) return;
      if (anchor.target === "_blank") return;

      setNavigating(true);
    }

    function handleNavigationStart() {
      setNavigating(true);
    }

    document.addEventListener("click", handleClick);
    window.addEventListener("navigation-start", handleNavigationStart);
    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("navigation-start", handleNavigationStart);
    };
  }, []);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      setNavigating(false);
    }
  }, [pathname]);

  return (
    <AnimatePresence>
      {navigating && (
        <motion.div
          className={style.bar}
          initial={{ width: "0%" }}
          animate={{ width: "95%" }}
          exit={{ opacity: 0, width: "100%" }}
          transition={{
            width: { duration: 2, ease: "easeOut" },
            opacity: { duration: 0.3, delay: 0.1 },
          }}
        />
      )}
    </AnimatePresence>
  );
}
