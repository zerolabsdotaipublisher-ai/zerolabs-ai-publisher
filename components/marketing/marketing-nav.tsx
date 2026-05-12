"use client";

import Link from "next/link";
import { routes } from "@/config/routes";

interface MarketingNavProps {
  currentPath?: typeof routes.home | "/blog" | typeof routes.login;
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
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <Link
          href={routes.home}
          className="flex items-center gap-3 text-sm font-semibold tracking-[0.24em] text-white uppercase"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-400/10 text-cyan-200">
            ZL
          </span>
          Zero Labs AI Publisher
        </Link>

        <nav aria-label="Primary navigation" className="flex flex-1 flex-wrap items-center justify-end gap-3 text-sm text-slate-200">
          {navigationItems.map((item) => (
            <Link
              key={item.label}
              href={resolveHref(item)}
              className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={routes.login}
            className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 font-medium text-cyan-100 transition hover:border-cyan-300/70 hover:bg-cyan-300/15"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
