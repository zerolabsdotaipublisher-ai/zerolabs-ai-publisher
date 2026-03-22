import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zero Labs AI Publisher",
  description: "AI-powered automated publishing platform for websites, portfolios, and social media",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
