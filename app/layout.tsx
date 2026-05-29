import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { getPublicConfig } from "@/config";
import { AuthProvider } from "@/providers/auth-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { themeInitializationScript } from "@/lib/theme";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="zero-labs-theme-init" strategy="beforeInteractive">
          {themeInitializationScript}
        </Script>
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ThemeProvider>
          <AuthProvider
            supabaseConfig={{
              url: publicConfig.supabase.url,
              anonKey: publicConfig.supabase.anonKey,
              appUrl: publicConfig.url,
            }}
          >
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
