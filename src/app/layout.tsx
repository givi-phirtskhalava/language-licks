import type { Metadata } from "next";
import Header from "@/components/atoms/Header";
import NavigationProgress from "@/components/atoms/NavigationProgress";
import ProgressSync from "@/components/atoms/ProgressSync";
import ToastProvider from "@/components/atoms/ToastProvider";
import QueryProvider from "@lib/providers/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Language Licks",
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
        <QueryProvider>
          <NavigationProgress />
          <ProgressSync />
          <Header />
          <ToastProvider />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
