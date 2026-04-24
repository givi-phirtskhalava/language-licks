"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
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

const FOOTER_ITEMS = [
  { href: "/about", label: "About" },
  { href: "#", label: "Terms" },
  { href: "#", label: "Privacy" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const { language } = useLanguage();
  const { getLesson, pausedAt } = useProgress(language);
  const { data: lessons } = useLessons(language);
  const [menuOpen, setMenuOpen] = useState(false);

  const today = getToday();
  const dueReviewCount = pausedAt
    ? 0
    : (lessons?.filter((lesson) => {
        const p = getLesson(lesson.id);
        return (
          p &&
          p.completed &&
          !p.retired &&
          p.nextReview &&
          p.nextReview <= today
        );
      }).length ?? 0);

  const authItem = isLoggedIn
    ? { href: "/profile", label: "Profile" }
    : { href: "/login", label: "Log in" };

  const navItems = [...NAV_ITEMS, authItem];

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  function handleNavClick(href: string) {
    if (pathname === href) {
      window.dispatchEvent(new CustomEvent("nav-reset"));
    }
    setMenuOpen(false);
  }

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
            onClick={() => handleNavClick(href)}
          >
            {label}
            {href === "/reviews" && dueReviewCount > 0 && (
              <span className={style.dot}>{dueReviewCount}</span>
            )}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        className={style.hamburger}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen && <FontAwesomeIcon icon={faXmark} />}
        {!menuOpen && <FontAwesomeIcon icon={faBars} />}
      </button>

      {menuOpen && (
        <div className={style.menu}>
          <nav className={style.menuNav}>
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={classNames(
                  style.menuLink,
                  pathname === href && style.menuLinkActive
                )}
                onClick={() => handleNavClick(href)}
              >
                {label}
                {href === "/reviews" && dueReviewCount > 0 && (
                  <span className={style.dot}>{dueReviewCount}</span>
                )}
              </Link>
            ))}
          </nav>

          <nav className={style.menuFooter}>
            {FOOTER_ITEMS.map(({ href, label }) => (
              <a
                key={label}
                href={href}
                className={style.menuFooterLink}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
