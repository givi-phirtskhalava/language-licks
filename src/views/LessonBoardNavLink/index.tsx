"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import classNames from "classnames";

import style from "./LessonBoardNavLink.module.css";

const HREF = "/admin/lesson-board";
const LESSONS_PREFIX = "/admin/collections/lessons";

export default function LessonBoardNavLink() {
  const pathname = usePathname();
  const isActive =
    pathname === HREF ||
    pathname === LESSONS_PREFIX ||
    pathname.startsWith(`${LESSONS_PREFIX}/`);

  return (
    <Link
      href={HREF}
      id="nav-lesson-board"
      className={classNames("nav__link", style.link)}
      prefetch={false}
    >
      {isActive && <div className="nav__link-indicator" />}
      <span className="nav__link-label">Lessons</span>
    </Link>
  );
}
