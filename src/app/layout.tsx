import type { Metadata, Viewport } from "next";
import { Fredoka, Inter } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Loop Runner",
  description:
    "Run, collect Loop products, dodge the roadblocks and unlock Loop's Churn Playbook.",
  openGraph: {
    title: "Loop Runner",
    description: "Beat the run in 60 seconds and unlock Loop's Churn Playbook.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0E0E10",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fredoka.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
