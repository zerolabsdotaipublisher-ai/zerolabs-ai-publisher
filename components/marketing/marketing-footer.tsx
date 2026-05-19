import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { routes } from "@/config/routes";
import { MarketingTheme } from "./theme-toggle";

interface MarketingFooterProps {
  contained?: boolean;
  theme?: MarketingTheme;
}

function buildFooterSurfaceStyle(isDark: boolean): CSSProperties {
  return {
    padding: "clamp(40px, 5vw, 64px)",
    ["--marketing-surface-bg" as string]: isDark
      ? "linear-gradient(135deg, rgba(11,36,29,0.82), rgba(6,26,20,0.86), rgba(18,65,112,0.10))"
      : "linear-gradient(135deg, rgba(248,249,250,0.84), rgba(234,242,239,0.88), rgba(173,230,205,0.16))",
    ["--marketing-surface-border" as string]: isDark ? "rgba(173,230,205,0.18)" : "rgba(31,111,95,0.16)",
    ["--marketing-surface-shadow" as string]: isDark
      ? "0 30px 100px rgba(0,0,0,0.24)"
      : "0 30px 100px rgba(18,65,112,0.08)",
    ["--marketing-surface-hover-border" as string]: isDark ? "rgba(173,230,205,0.28)" : "rgba(31,111,95,0.24)",
    ["--marketing-surface-hover-shadow" as string]: isDark
      ? "0 0 34px rgba(31,111,95,0.18), 0 30px 100px rgba(0,0,0,0.24)"
      : "0 0 28px rgba(31,111,95,0.12), 0 30px 100px rgba(18,65,112,0.08)",
  } as CSSProperties;
}

export function MarketingFooter({ contained = false, theme = "light" }: MarketingFooterProps) {
  const isDark = theme === "dark";
  const logoSrc = isDark ? "/images/Zero Labs Logo transparent.svg" : "/images/Zero Labs Logo colored.svg";

    const content = (
    <footer className="marketing-panel-surface rounded-[40px] backdrop-blur-2xl" style={buildFooterSurfaceStyle(isDark)}>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end lg:gap-20">
        <div className="max-w-2xl space-y-6">
          <div className="flex items-center gap-3">
            <Image src={logoSrc} alt="" width={180} height={40} className="h-10 w-auto" />
            <span className="font-[family:var(--font-heading)] text-sm font-semibold tracking-[0.1em] text-current sm:text-base">
              Zero Labs AI Publisher
            </span>
          </div>
          <p className="marketing-label-muted text-xs font-semibold tracking-[0.16em]">
            Sustainable AI · Editorial storytelling · Humanistic publishing
          </p>
          <p className="max-w-2xl font-[family:var(--font-heading)] text-3xl font-semibold leading-[1.08] sm:text-4xl lg:text-[2.9rem]">
            Zero Labs AI Publisher
          </p>
          <p className="marketing-copy-muted max-w-xl text-base leading-8 sm:text-lg">
            AI-powered publishing infrastructure for sustainable, humanistic digital operations.
          </p>
          <p className="marketing-copy-muted text-sm">© 2026 Zero Labs AI Publisher. Built by Zero Labs.</p>
        </div>

        <div className="flex items-start lg:justify-end">
          <Link href={routes.signup} className="marketing-primary-button inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-semibold">
            Start building
          </Link>
        </div>
      </div>
    </footer>
  );

  if (contained) {
    return content;
  }

  return (
    <div className="marketing-shell pb-[64px] sm:pb-[72px]" style={{ paddingBottom: "clamp(64px, 6vw, 88px)" }}>
      {content}
    </div>
  );
}
