export type AppTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "zero-labs-ai-publisher-theme";
export const DEFAULT_THEME: AppTheme = "light";

export function isAppTheme(value: string | null | undefined): value is AppTheme {
  return value === "light" || value === "dark";
}

export function getSystemTheme(): AppTheme {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveStoredTheme(): AppTheme {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isAppTheme(storedTheme) ? storedTheme : getSystemTheme();
}

export function applyTheme(theme: AppTheme) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export const themeInitializationScript = `
  (() => {
    const storageKey = ${JSON.stringify(THEME_STORAGE_KEY)};
    const defaultTheme = ${JSON.stringify(DEFAULT_THEME)};
    try {
      const storedTheme = window.localStorage.getItem(storageKey);
      const theme =
        storedTheme === "light" || storedTheme === "dark"
          ? storedTheme
          : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : defaultTheme);
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
      window.localStorage.setItem(storageKey, theme);
    } catch {
      document.documentElement.dataset.theme = defaultTheme;
      document.documentElement.style.colorScheme = defaultTheme;
    }
  })();
`;
