import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900", "1000"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "أفشات - Afchat.fun | أقوى قفشات وبانشلاين الردود العربية",
  description: "اكتشف وشارك أقوى الردود الساخرة والقفشات المضحكة في الوطن العربي. منصة أفشات لأفضل الكوميديا العربية.",
  openGraph: {
    title: "أفشات - Afchat.fun",
    description: "أقوى منصة للقفشات والردود العربية الساخرة",
    url: "https://afchat.fun",
    siteName: "أفشات",
    images: [
      {
        url: "https://afchat.fun/og?setup=أفشات&punchline=أقوى قفشات والردود العربية&v=2.0",
        width: 1200,
        height: 630,
        alt: "أفشات - Afchat.fun",
      },
    ],
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "أفشات - Afchat.fun",
    description: "أقوى منصة للقفشات والردود العربية الساخرة",
    images: ["https://afchat.fun/og?setup=أفشات&punchline=أقوى قفشات والردود العربية&v=2.0"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head />
      <body
        className={`${cairo.variable} font-[family-name:var(--font-cairo)] antialiased`}
      >
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Z42NHNFBSQ"
          strategy="afterInteractive"
        />
        
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Z42NHNFBSQ', {
              page_path: window.location.pathname,
            });
          `}
        </Script>

        {children}
      </body>
    </html>
  );
}
