"use client";

import Link from "next/link";
import style from "./notFound.module.css";

export default function NotFound() {
  return (
    <div className={style.container}>
      <div className={style.content}>
        <h1 className={style.title}>404</h1>
        <p className={style.message}>This page doesn't exist.</p>
        {/* use a tag to force hard refresh because dark theme isn't working well with 404 page*/}
        <a href="/" className={style.link}>
          Back to home
        </a>
      </div>
    </div>
  );
}
