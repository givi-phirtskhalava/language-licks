import type { Metadata } from "next";
import { Sniglet } from "next/font/google";
import Header from "@/components/atoms/Header";
import Footer from "@/components/organisms/Footer";
import PastDueBanner from "@/components/atoms/PastDueBanner";
import NavigationProgress from "@/components/atoms/NavigationProgress";
import ProgressSync from "@/components/atoms/ProgressSync";
import ToastProvider from "@/components/atoms/ToastProvider";
import QueryProvider from "@lib/providers/QueryProvider";
import "./globals.css";

const sniglet = Sniglet({
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LanguageLicks",
  description: "Practice French pronunciation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ "--font-logo": sniglet.style.fontFamily } as React.CSSProperties}>
      <body>
        <QueryProvider>
          <NavigationProgress />
          <ProgressSync />
          <PastDueBanner />
          <Header />
          <ToastProvider />
          {children}
          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}
