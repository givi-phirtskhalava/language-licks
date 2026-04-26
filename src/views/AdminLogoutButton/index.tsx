"use client";

import type { MouseEvent } from "react";

const WARNING =
  "Logging out of LanguageLicks does NOT sign you out of Google.\n\n" +
  "If this is a public or shared computer, also sign out of your Google account at accounts.google.com — otherwise the next person can access your Gmail and other Google services.\n\n" +
  "Continue with logout?";

function handleClick(e: MouseEvent<HTMLAnchorElement>) {
  if (!window.confirm(WARNING)) {
    e.preventDefault();
  }
}

export default function AdminLogoutButton() {
  return (
    <a
      href="/api/admin/logout"
      className="nav__link"
      id="nav-admin-logout"
      onClick={handleClick}
    >
      <span className="nav__link-label">Log Out</span>
    </a>
  );
}
