import type { Metadata } from "next";
import "./globals.css";
import { getPublicConfig } from "@/config";
import { AuthProvider } from "@/providers/auth-provider";

export const metadata: Metadata = {
  title: "Zero Labs AI Publisher",
  description: "AI-powered automated publishing platform for websites, portfolios, and social media",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publicConfig = getPublicConfig();

  return (
    <html lang="en">
      <body>
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
