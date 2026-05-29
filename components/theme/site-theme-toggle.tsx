"use client";

import { ThemeToggle } from "@/components/marketing/theme-toggle";
import { useTheme } from "@/providers/theme-provider";

interface SiteThemeToggleProps {
  className?: string;
}

export function SiteThemeToggle({ className }: SiteThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return <ThemeToggle theme={theme} onToggle={toggleTheme} className={className} />;
}
