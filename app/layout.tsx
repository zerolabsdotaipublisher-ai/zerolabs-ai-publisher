import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { VercelAnalyticsTracker } from "@/components/analytics/vercel-analytics";
import { publicAppConfig } from "@/config/public";
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
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script id="zero-labs-theme-init" strategy="beforeInteractive">
          {themeInitializationScript}
        </Script>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ThemeProvider>
          <AuthProvider
            supabaseConfig={{
              url: publicAppConfig.supabase.url,
              anonKey: publicAppConfig.supabase.anonKey,
              appUrl: publicAppConfig.url,
            }}
          >
            {children}
          </AuthProvider>
        </ThemeProvider>
        <VercelAnalyticsTracker />
      </body>
    </html>
  );
}
