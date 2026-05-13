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

const shellClass = "mx-auto w-full max-w-[1440px] px-5 sm:px-6 lg:px-10 xl:px-12";
const shellStyle = {
  marginInline: "auto",
  width: "100%",
  maxWidth: "1440px",
  paddingInline: "clamp(20px, 3vw, 48px)",
};

function buildSurfaceStyle(isDark: boolean): CSSProperties {
  return {
    padding: "clamp(18px, 2.2vw, 24px) clamp(20px, 3vw, 36px)",
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
    <header className="marketing-panel-surface rounded-[36px] backdrop-blur-2xl" style={buildSurfaceStyle(isDark)}>
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(260px,1fr)_auto_minmax(260px,1fr)] lg:items-center lg:gap-8">
        <div className="flex items-center justify-between gap-3 lg:justify-start">
          <Link href={routes.home} className="flex min-w-0 items-center gap-3">
            <Image src={logoSrc} alt="" width={180} height={40} priority className="h-10 w-auto shrink-0" />
            <span className="min-w-0 font-[family:var(--font-heading)] text-sm font-semibold tracking-[0.06em] text-current sm:text-base">
              Zero Labs AI Publisher
            </span>
          </Link>
        </div>

        <nav aria-label="Primary navigation" className="marketing-label-muted flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm font-medium tracking-[0.04em] sm:gap-x-8">
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
        </nav>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="marketing-pill-control hidden min-w-[108px] text-sm font-semibold tracking-[0.08em] md:inline-flex">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 stroke-current" fill="none" strokeWidth="1.8">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4.5 4.5" strokeLinecap="round" />
            </svg>
            <span>Search</span>
          </div>
          <Link href={routes.login} className="marketing-secondary-button min-w-[78px] text-sm font-semibold">
            Login
          </Link>
          <Link href={routes.signup} className="marketing-primary-button min-w-[92px] text-sm font-semibold">
            Signup
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
    <div className={`${shellClass} pt-[24px] md:pt-[32px]`} style={{ ...shellStyle, paddingTop: "clamp(32px, 5vw, 56px)" }}>
      {content}
    </div>
  );
}
