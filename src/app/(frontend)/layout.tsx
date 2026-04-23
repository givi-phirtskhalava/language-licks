import type { Metadata } from "next";
import Header from "@/components/atoms/Header";
import Footer from "@/components/organisms/Footer";
import PastDueBanner from "@/components/atoms/PastDueBanner";
import NavigationProgress from "@/components/atoms/NavigationProgress";
import ProgressSync from "@/components/atoms/ProgressSync";
import ToastProvider from "@/components/atoms/ToastProvider";
import DevGui from "@/components/atoms/DevGui";
import QueryProvider from "@lib/providers/QueryProvider";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const siteName = "LanguageLicks";
const siteDescription =
  "Practice real French and Italian sentences — comprehension, writing, and speaking. Build fluency one sentence at a time.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — Practice French & Italian Sentences`,
    template: `%s — ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  icons: {
    icon: "https://assets.glitch.ge/languagelicks/meta/fav.png",
    apple: "https://assets.glitch.ge/languagelicks/meta/fav.png",
  },
  keywords: [
    "learn French",
    "learn Italian",
    "French sentences",
    "Italian sentences",
    "French pronunciation",
    "Italian pronunciation",
    "language learning",
    "spaced repetition",
    "French practice",
    "Italian practice",
    "speaking practice",
    "writing practice",
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName,
    title: `${siteName} — Practice French & Italian Sentences`,
    description: siteDescription,
  },
  twitter: {
    card: "summary",
    title: `${siteName} — Practice French & Italian Sentences`,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
