"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import classNames from "classnames";

import style from "./CustomerLookupNavLink.module.css";

const HREF = "/admin/customer-lookup";

export default function CustomerLookupNavLink() {
  const pathname = usePathname();
  const isActive = pathname === HREF;

  return (
    <Link
      href={HREF}
      id="nav-customer-lookup"
      className={classNames("nav__link", style.link)}
      prefetch={false}
    >
      {isActive && <div className="nav__link-indicator" />}
      <span className="nav__link-label">Customer Lookup</span>
    </Link>
  );
}
