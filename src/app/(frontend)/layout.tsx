import type { Metadata } from "next";
import { Google_Sans_Flex } from "next/font/google";
import Header from "@/components/atoms/Header";
import Footer from "@/components/organisms/Footer";
import PastDueBanner from "@/components/atoms/PastDueBanner";
import NavigationProgress from "@/components/atoms/NavigationProgress";
import ProgressSync from "@/components/atoms/ProgressSync";
import ToastProvider from "@/components/atoms/ToastProvider";
import DevGui from "@/components/atoms/DevGui";
import QueryProvider from "@lib/providers/QueryProvider";
import "./globals.css";

const googleSansFlex = Google_Sans_Flex({
  weight: "variable",
  subsets: ["latin"],
  variable: "--font-google-sans-flex",
});

export const metadata: Metadata = {
  title: "LanguageLicks",
  description: "Practice French and Italian sentences — comprehension, writing, and pronunciation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={googleSansFlex.variable}>
      <body>
        <QueryProvider>
          <NavigationProgress />
          <ProgressSync />
          <PastDueBanner />
          <Header />
          <ToastProvider />
          {children}
          <Footer />
          {process.env.NODE_ENV === "development" && <DevGui />}
        </QueryProvider>
      </body>
    </html>
  );
}
