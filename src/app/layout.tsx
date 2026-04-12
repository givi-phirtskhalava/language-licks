import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Language Training",
  description: "Practice French pronunciation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
