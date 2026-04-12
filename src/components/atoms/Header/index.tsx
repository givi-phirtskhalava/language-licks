"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import classNames from "classnames";
import { getLessons } from "@lib/lessons";
import useLanguage from "@lib/useLanguage";
import useProgress from "@lib/useProgress";
import style from "./Header.module.css";

const NAV_ITEMS = [
  { href: "/", label: "Lessons" },
  { href: "/reviews", label: "Reviews" },
  { href: "/settings", label: "Settings" },
  { href: "/profile", label: "Profile" },
];

export default function Header() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const { getLesson, pausedAt } = useProgress(language);
  const lessons = getLessons(language);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const effectiveNow = pausedAt ?? now;
  const hasDueReviews = lessons.some((_, index) => {
    const p = getLesson(index);
    return (
      p &&
      p.completed &&
      !p.retired &&
      p.nextReview &&
      p.nextReview <= effectiveNow
    );
  });

  return (
    <header className={style.header}>
      {NAV_ITEMS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={classNames(
            style.link,
            pathname === href && style.active
          )}
          onClick={() => {
            if (pathname === href) {
              window.dispatchEvent(new CustomEvent("nav-reset"));
            }
          }}
        >
          {label}
          {href === "/reviews" && hasDueReviews && (
            <span className={style.dot} />
          )}
        </Link>
      ))}
    </header>
  );
}
