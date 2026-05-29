"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { routes } from "@/config/routes";
import { useTheme } from "@/providers/theme-provider";

interface MarketingFooterProps {
  contained?: boolean;
}

const footerLinkGroups = [
  {
    title: "Product",
    links: [
      { label: "Platform", href: "/#platform" },
      { label: "Insights", href: "/#insights" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Blog", href: routes.blog },
      { label: "Login", href: routes.login },
      { label: "Create account", href: routes.signup },
    ],
  },
] as const;

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

export function MarketingFooter({ contained = false }: MarketingFooterProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const logoSrc = isDark ? "/images/Zero Labs Logo transparent.svg" : "/images/Zero Labs Logo colored.svg";

  const content = (
    <footer className="marketing-panel-surface rounded-[40px] backdrop-blur-2xl" style={buildFooterSurfaceStyle(isDark)}>
      <div
        className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] items-start"
        style={{ gap: "clamp(24px, 3vw, 48px)" }}
      >
        <div className="max-w-2xl space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Image src={logoSrc} alt="" width={180} height={40} className="h-10 w-auto" />
            <span className="font-[family:var(--font-heading)] text-sm font-semibold tracking-[0.1em] text-current sm:text-base">
              Zero Labs AI Publisher
            </span>
          </div>
          <p className="marketing-label-muted text-xs font-semibold tracking-[0.16em]">
            Sustainable AI / Editorial storytelling / Humanistic publishing
          </p>
          <p className="max-w-2xl font-[family:var(--font-heading)] text-3xl font-semibold leading-[1.08] sm:text-4xl lg:text-[2.9rem]">
            Zero Labs AI Publisher
          </p>
          <p className="marketing-copy-muted max-w-xl text-base leading-8 sm:text-lg">
            AI-powered publishing infrastructure for sustainable, humanistic digital operations.
          </p>
          <p className="marketing-copy-muted text-sm">Copyright 2026 Zero Labs AI Publisher. Built by Zero Labs.</p>
        </div>

        {footerLinkGroups.map((group) => (
          <div key={group.title} className="grid content-start gap-4">
            <p className="marketing-label-muted text-xs font-semibold tracking-[0.16em] uppercase">{group.title}</p>
            <div className="grid gap-3">
              {group.links.map((link) => (
                <Link key={link.href} href={link.href} className="marketing-copy-muted text-sm transition-colors duration-300 hover:text-current">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="grid content-start gap-5">
          <p className="marketing-label-muted text-xs font-semibold tracking-[0.16em] uppercase">Get started</p>
          <p className="marketing-copy-muted max-w-sm text-sm leading-7">
            Move from prompt to launch with a fluid workspace that adapts across every screen width.
          </p>
          <Link href={routes.signup} className="marketing-primary-button inline-flex min-h-11 w-full items-center justify-center rounded-full px-6 text-sm font-semibold sm:w-fit">
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
