import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { getPublicConfig } from "@/config";
import { AuthProvider } from "@/providers/auth-provider";

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const headingFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "Zero Labs AI Publisher",
  description: "Investor-ready AI publishing infrastructure for websites, portfolios, blogs, and social content.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publicConfig = getPublicConfig();

  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${headingFont.variable} ${bodyFont.className}`}>
        <AuthProvider
          supabaseConfig={{
            url: publicConfig.supabase.url,
            anonKey: publicConfig.supabase.anonKey,
            appUrl: publicConfig.url,
          }}
        >
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
