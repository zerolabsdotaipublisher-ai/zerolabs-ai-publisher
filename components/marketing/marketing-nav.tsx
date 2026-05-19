"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { routes } from "@/config/routes";
import { MarketingTheme, ThemeToggle } from "./theme-toggle";

interface MarketingNavProps {
  currentPath?: string;
  contained?: boolean;
  theme?: MarketingTheme;
  onToggleTheme?: () => void;
}

const navigationItems: Array<{ label: string; href: string; desktopOnly?: boolean }> = [
  { label: "Product", href: "#product" },
  { label: "Platform", href: "#platform" },
  { label: "Insights", href: "#insights" },
  { label: "Pricing", href: "#pricing" },
  { label: "Blog", href: "/blog", desktopOnly: true },
] as const;

function buildSurfaceStyle(isDark: boolean): CSSProperties {
  return {
    ["--marketing-nav-padding-block" as string]: "clamp(17px, 2vw, 22px)",
    ["--marketing-nav-padding-inline" as string]: "clamp(20px, 2.8vw, 34px)",
    ["--marketing-surface-bg" as string]: isDark ? "rgba(11,36,29,0.74)" : "rgba(248,249,250,0.82)",
    ["--marketing-surface-border" as string]: isDark ? "rgba(173,230,205,0.18)" : "rgba(31,111,95,0.16)",
    ["--marketing-surface-shadow" as string]: isDark
      ? "0 28px 90px rgba(0,0,0,0.22)"
      : "0 28px 90px rgba(18,65,112,0.08)",
    ["--marketing-surface-hover-border" as string]: isDark ? "rgba(173,230,205,0.3)" : "rgba(31,111,95,0.24)",
    ["--marketing-surface-hover-shadow" as string]: isDark
      ? "0 0 32px rgba(31,111,95,0.18), 0 28px 90px rgba(0,0,0,0.22)"
      : "0 0 24px rgba(31,111,95,0.12), 0 28px 90px rgba(18,65,112,0.08)",
  } as CSSProperties;
}

export function MarketingNav({
  currentPath = "/",
  contained = false,
  theme = "light",
  onToggleTheme,
}: MarketingNavProps) {
  const isDark = theme === "dark";
  const logoSrc = isDark ? "/images/Zero Labs Logo transparent.svg" : "/images/Zero Labs Logo colored.svg";

  const resolveHref = (href: string) => {
    if (!href.startsWith("#")) {
      return href;
    }

    return currentPath === "/" ? href : `/${href}`;
  };

  const content = (
    <header className="marketing-panel-surface marketing-nav-surface rounded-[36px] backdrop-blur-2xl" style={buildSurfaceStyle(isDark)}>
      <div className="marketing-nav-layout">
        <div className="marketing-nav-brand flex items-center justify-between gap-3 lg:justify-start">
          <Link href={routes.home} className="flex min-w-0 items-center gap-3">
            <Image src={logoSrc} alt="" width={180} height={40} priority className="h-10 w-auto shrink-0" />
            <span className="marketing-nav-brand-text min-w-0 font-[family:var(--font-heading)] text-[clamp(0.8rem,0.65rem+0.35vw,1rem)] font-semibold tracking-[0.06em] text-current">
              Zero Labs AI Publisher
            </span>
          </Link>
        </div>

        <nav
          aria-label="Primary navigation"
          className="marketing-nav-links marketing-label-muted"
        >
          <div className="marketing-nav-links-list">
          {navigationItems.map((item) => (
            <Link
              key={item.label}
              href={resolveHref(item.href)}
              className={[
                "transition-colors duration-300 hover:text-current",
                item.desktopOnly ? "hidden xl:inline-flex" : "inline-flex",
              ].join(" ")}
            >
              {item.label}
            </Link>
          ))}
          </div>
        </nav>

        <div className="marketing-nav-actions">
          <form
            role="search"
            className="marketing-nav-search marketing-search-control"
            onSubmit={(event) => event.preventDefault()}
          >
            <label className="sr-only" htmlFor="marketing-search">
              Search Zero Labs AI Publisher
            </label>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 stroke-current" fill="none" strokeWidth="1.8">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4.5 4.5" strokeLinecap="round" />
            </svg>
            <input
              id="marketing-search"
              type="search"
              name="q"
              placeholder="Search"
              aria-label="Search Zero Labs AI Publisher"
              autoComplete="off"
              className="min-w-0 flex-1"
            />
          </form>
          <Link
            href={routes.login}
            className="marketing-nav-login marketing-primary-button text-sm font-semibold"
          >
            Login / Sign up
          </Link>
          {onToggleTheme ? <ThemeToggle theme={theme} onToggle={onToggleTheme} /> : null}
        </div>
      </div>
    </header>
  );

  if (contained) {
    return content;
  }

  return (
    <div className="marketing-shell pt-[24px] md:pt-[32px]" style={{ paddingTop: "clamp(32px, 5vw, 56px)" }}>
      {content}
    </div>
  );
}
