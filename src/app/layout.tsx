import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { fontMono, fontSans } from "@/app/fonts";

export const metadata: Metadata = {
  title: "Simple POS",
  description: "A simple POS system with stock, sales, and profits."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontMono.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}

