"use client";

import { AppTheme } from "@/lib/theme";

export type MarketingTheme = AppTheme;

interface ThemeToggleProps {
  theme: MarketingTheme;
  onToggle: () => void;
  className?: string;
}

export function ThemeToggle({ theme, onToggle, className }: ThemeToggleProps) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? "Switch Zero Labs AI Publisher to light mode" : "Switch Zero Labs AI Publisher to dark mode"}
      aria-pressed={isDark}
      className={className}
    >
      <span className="sr-only">Toggle color theme</span>
      {isDark ? (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4.25" />
          <path d="M12 2.75v2.1M12 19.15v2.1M21.25 12h-2.1M4.85 12h-2.1M18.54 5.46l-1.48 1.48M6.94 17.06l-1.48 1.48M18.54 18.54l-1.48-1.48M6.94 6.94 5.46 5.46" />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M14.46 2.82a.95.95 0 0 1 .77 1.47 7.5 7.5 0 1 0 9.48 9.49.95.95 0 0 1 1.48.76A9.5 9.5 0 1 1 13.7 2.05a.95.95 0 0 1 .76.77Z" transform="translate(-2 -2)" />
        </svg>
      )}
    </button>
  );
}
