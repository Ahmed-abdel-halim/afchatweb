import type { Metadata } from "next";
import { Almarai, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const almarai = Almarai({
  subsets: ["arabic"],
  weight: ["300", "400", "700", "800"],
  variable: "--font-almarai",
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
        className={`${almarai.variable} ${geistSans.variable} ${geistMono.variable} font-[family-name:var(--font-almarai)] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
