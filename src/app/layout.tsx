import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { fontMono, fontSans } from "@/app/fonts";
import { Footer } from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Simple POS",
  description:
    "A multi-tenant point of sale web app for managing products, stock, sales, and customer reservations with role-based access control.",
  openGraph: {
    title: "Simple POS",
    description:
      "A multi-tenant point of sale web app for managing products, stock, sales, and customer reservations with role-based access control.",
    url: "https://simple-pos.jdgadores.dev",
    siteName: "Simple POS",
    images: [
      {
        url: "https://simple-pos.jdgadores.dev/og-image.png",
        width: 1200,
        height: 630,
        alt: "Simple POS — multi-tenant point of sale app",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Simple POS",
    description:
      "A multi-tenant point of sale web app for managing products, stock, sales, and customer reservations with role-based access control.",
    images: ["https://simple-pos.jdgadores.dev/og-image.png"],
  },
  metadataBase: new URL("https://simple-pos.jdgadores.dev"),
};

const noFlashScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`;

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <ThemeProvider>
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
