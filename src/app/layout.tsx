import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Forces SSR for every page instead of build-time static generation — pages
// query the database directly, and the DB is only reachable from the live
// server (not from wherever `next build` runs), so it must happen at request time.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "TapConnect | Digital Identity, Profile & Mini Commerce Platform",
  description: "Tap your card, share your world. Your TapConnect Digital Card (powered by NFC + QR) turns into your digital profile, mini website and mini store.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">{children}</body>
    </html>
  );
}
