import type { Metadata } from "next";
import { Readex_Pro, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const readexPro = Readex_Pro({
  subsets: ["arabic"],
  weight: ["200", "300", "400", "500", "600", "700"],
  variable: "--font-readex-pro",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "أفشات - تجربة الأفشات الكاملة",
  description: "أول منصة لمشاركة الأفشات والمواقف الكوميدية والتريندات.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${readexPro.variable} ${geistSans.variable} ${geistMono.variable} font-[family-name:var(--font-readex-pro)] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
