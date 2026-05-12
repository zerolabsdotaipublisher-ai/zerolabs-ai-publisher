"use client";

import Link from "next/link";
import { routes } from "@/config/routes";

interface MarketingNavProps {
  currentPath?: string;
}

const navigationItems = [
  { label: "Home", href: routes.home },
  { label: "About", section: "about" },
  { label: "Blog", href: "/blog" },
  { label: "Search", section: "search" },
  { label: "Insights", section: "insights" },
] as const;

export function MarketingNav({ currentPath = "/" }: MarketingNavProps) {
  const resolveHref = (item: (typeof navigationItems)[number]) => {
    if ("href" in item) {
      return item.href;
    }

    return currentPath === "/" ? `#${item.section}` : `/#${item.section}`;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-400/15 bg-slate-950/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-8 xl:px-0">
        <Link
          href={routes.home}
          className="flex items-center gap-3 text-sm font-semibold tracking-[0.2em] text-white uppercase"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400/50 bg-emerald-400/15 text-emerald-200">
            ZL
          </span>
          Zero Labs AI Publisher
        </Link>

        <nav
          aria-label="Primary navigation"
          className="flex w-full flex-wrap items-center justify-start gap-2 text-sm text-slate-200 md:w-auto md:justify-end"
        >
          {navigationItems.map((item) => (
            <Link
              key={item.label}
              href={resolveHref(item)}
              className="rounded-full px-4 py-2 transition hover:bg-emerald-400/10 hover:text-emerald-100"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={routes.login}
            className="inline-flex items-center justify-center rounded-full border border-emerald-300/50 bg-emerald-500/15 px-5 py-2.5 font-semibold text-emerald-100 transition hover:border-emerald-200/80 hover:bg-emerald-400/20 hover:text-white"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
