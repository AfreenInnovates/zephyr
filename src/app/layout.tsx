import type { Metadata } from "next";
import { Bayon, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import IntroLoader from "@/components/IntroLoader";
import RouteLoader from "@/components/RouteLoader";
import Nav from "@/components/Nav";

const bayon = Bayon({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zephyr - the cool head watching every field",
  description:
    "Zephyr joins youth sports schedules with hyperlocal heat and air-quality conditions, flagging every practice about to happen in dangerous conditions - in time for a coach or parent to act.",
  openGraph: {
    title: "Zephyr",
    description:
      "The missing alarm for youth sports. It watches every field and every forecast at once, and rings before kids ever step onto a dangerous field.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${bayon.variable} ${manrope.variable} ${jetbrains.variable}`}
    >
      <body className="grain font-sans antialiased">
        <IntroLoader />
        <RouteLoader />
        <Nav />
        {children}
      </body>
    </html>
  );
}
