import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { fontMono, fontSans } from "@/app/fonts";
import { Footer } from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Simple POS",
  description: "A simple POS system with stock, sales, and profits.",
  openGraph: {
    title: "Simple POS",
    description: "A simple POS system with stock, sales, and profits.",
    url: "https://simple-pos-rosy.vercel.app",
    siteName: "Simple POS",
    images: [
      {
        url: "https://simple-pos-rosy.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Simple POS",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Simple POS",
    description: "A simple POS system with stock, sales, and profits.",
    images: ["https://simple-pos-rosy.vercel.app/og-image.png"],
  },
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
