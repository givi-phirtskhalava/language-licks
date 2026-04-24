"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import classNames from "classnames";
import useLessons from "@lib/hooks/useLessons";
import useLanguage from "@lib/useLanguage";
import useProgress, { getToday } from "@lib/useProgress";
import useAuth from "@lib/hooks/useAuth";
import style from "./Header.module.css";

const NAV_ITEMS = [
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

  const today = getToday();
  const hasDueReviews =
    !pausedAt &&
    lessons?.some((lesson) => {
      const p = getLesson(lesson.id);
      return (
        p && p.completed && !p.retired && p.nextReview && p.nextReview <= today
      );
    });

  const authItem = isLoggedIn
    ? { href: "/profile", label: "Profile" }
    : { href: "/login", label: "Log in" };

  const navItems = [...NAV_ITEMS, authItem];

  return (
    <header className={style.header}>
      <Link href="/" className={style.brand}>
        LanguageLicks
      </Link>

      <nav className={style.nav}>
        {navItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={classNames(style.link, pathname === href && style.active)}
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
      </nav>
    </header>
  );
}
