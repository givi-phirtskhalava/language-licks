import type { Metadata } from "next";
import Link from "next/link";
import style from "./globalNotFound.module.css";
import "./(frontend)/globals.css";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for does not exist.",
};

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@100..1000&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className={style.container}>
          <div className={style.content}>
            <h1 className={style.title}>404</h1>
            <p className={style.message}>This page doesn't exist.</p>
            <Link href="/" className={style.link}>Go home</Link>
          </div>
        </div>
      </body>
    </html>
  );
}
