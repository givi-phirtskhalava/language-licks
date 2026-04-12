"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import classNames from "classnames";
import style from "./Header.module.css";

const NAV_ITEMS = [
  { href: "/", label: "Lessons" },
  { href: "/settings", label: "Settings" },
  { href: "/profile", label: "Profile" },
];

export default function Header() {
  const pathname = usePathname();

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
        >
          {label}
        </Link>
      ))}
    </header>
  );
}
