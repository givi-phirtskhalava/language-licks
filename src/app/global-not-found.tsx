import type { Metadata } from "next";
import { Google_Sans_Flex } from "next/font/google";
import Link from "next/link";
import style from "./globalNotFound.module.css";
import "./(frontend)/globals.css";

const googleSansFlex = Google_Sans_Flex({
  weight: "variable",
  subsets: ["latin"],
  variable: "--font-google-sans-flex",
});

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for does not exist.",
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className={googleSansFlex.variable}>
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
