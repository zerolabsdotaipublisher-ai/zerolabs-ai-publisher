"use client";

export type MarketingTheme = "light" | "dark";

interface ThemeToggleProps {
  theme: MarketingTheme;
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? "Switch Zero Labs AI Publisher to light mode" : "Switch Zero Labs AI Publisher to dark mode"}
      className="marketing-icon-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F6F5F] focus-visible:ring-offset-2"
    >
      <span className="sr-only">Toggle color theme</span>
      {isDark ? (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M12 17.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11Zm0-15.5a1 1 0 0 1 1 1v1.5a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Zm0 16.5a1 1 0 0 1 1 1V21a1 1 0 1 1-2 0v-1.5a1 1 0 0 1 1-1Zm9-7.5a1 1 0 0 1 0 2h-1.5a1 1 0 1 1 0-2H21ZM5.5 12a1 1 0 0 1-1 1H3a1 1 0 1 1 0-2h1.5a1 1 0 0 1 1 1Zm11.157-6.657a1 1 0 0 1 1.414 0l1.06 1.06a1 1 0 0 1-1.414 1.415l-1.06-1.061a1 1 0 0 1 0-1.414ZM6.283 16.717a1 1 0 0 1 1.414 0l1.06 1.06a1 1 0 0 1-1.414 1.415l-1.06-1.061a1 1 0 0 1 0-1.414Zm12.848 2.474a1 1 0 0 1-1.414 0l-1.06-1.06a1 1 0 1 1 1.414-1.415l1.06 1.061a1 1 0 0 1 0 1.414ZM8.757 7.343A1 1 0 0 1 7.343 7.34L6.282 6.283a1 1 0 1 1 1.415-1.414l1.06 1.06a1 1 0 0 1 0 1.414Z" />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M14.768 3.96a1 1 0 0 1 .79 1.608 7 7 0 1 0 8.885 8.885 1 1 0 0 1 1.608.79A9 9 0 1 1 13.97 2.352a1 1 0 0 1 .799 1.608Z" transform="translate(-2 -2)" />
        </svg>
      )}
    </button>
  );
}
