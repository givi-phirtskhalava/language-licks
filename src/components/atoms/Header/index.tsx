"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import classNames from "classnames";
import useLessons from "@lib/hooks/useLessons";
import useLanguage from "@lib/useLanguage";
import useProgress from "@lib/useProgress";
import useAuth from "@lib/hooks/useAuth";
import style from "./Header.module.css";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/lessons", label: "Lessons" },
  { href: "/reviews", label: "Reviews" },
  { href: "/settings", label: "Settings" },
];

export default function Header() {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const { language } = useLanguage();
  const { getLesson, pausedAt } = useProgress(language);
  const { data: lessons } = useLessons(language);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const effectiveNow = pausedAt ?? now;
  const hasDueReviews = lessons?.some((lesson) => {
    const p = getLesson(lesson.id);
    return (
      p &&
      p.completed &&
      !p.retired &&
      p.nextReview &&
      p.nextReview <= effectiveNow
    );
  });

  const authItem = isLoggedIn
    ? { href: "/profile", label: "Profile" }
    : { href: `/login?redirect=${pathname}`, label: "Log in" };

  const navItems = [...NAV_ITEMS, authItem];

  return (
    <header className={style.header}>
      <span className={style.logo}>LanguageLicks</span>
      {navItems.map(({ href, label }) => (
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
