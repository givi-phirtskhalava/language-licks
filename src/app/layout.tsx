import type { Metadata } from "next";
import Header from "@/components/atoms/Header";
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
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
