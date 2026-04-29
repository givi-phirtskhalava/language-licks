"use client";

import { NavGroup } from "@payloadcms/ui";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import classNames from "classnames";

import { LANGUAGES, DEFAULT_LANGUAGE } from "@/lib/projectConfig";

const HREF_BASE = "/admin/lesson-board";

export default function LessonsNavLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onLessonBoard = pathname === HREF_BASE;
  const currentLang = searchParams.get("language") ?? DEFAULT_LANGUAGE;

  return (
    <NavGroup label="Lessons" isOpen>
      {LANGUAGES.map(function renderLink(lang) {
        const href = `${HREF_BASE}?language=${lang.id}`;
        const isActive = onLessonBoard && currentLang === lang.id;

        return (
          <Link
            key={lang.id}
            href={href}
            id={`nav-lesson-board-${lang.id}`}
            className={classNames("nav__link")}
            prefetch={false}
          >
            {isActive && <div className="nav__link-indicator" />}
            <span className="nav__link-label">{lang.label}</span>
          </Link>
        );
      })}
    </NavGroup>
  );
}
