import Link from "next/link";
import { routes } from "@/config/routes";

export function MarketingFooter() {
  return (
    <footer className="border-t border-emerald-400/15 bg-slate-950">
      <div className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-8 xl:px-0">
        <div className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 p-8 sm:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold tracking-[0.22em] text-emerald-200 uppercase">Zero Labs AI Publisher</p>
              <p className="text-xl font-semibold text-white">AI-native publishing infrastructure for modern teams.</p>
              <p className="text-sm leading-7 text-slate-300">
                Prompt-first website and content operations for teams that need speed, review control, and measurable output.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
              <Link href={routes.home} className="rounded-full px-4 py-2 transition hover:bg-emerald-400/10 hover:text-emerald-100">
                Home
              </Link>
              <Link
                href={`${routes.home}#about`}
                className="rounded-full px-4 py-2 transition hover:bg-emerald-400/10 hover:text-emerald-100"
              >
                About
              </Link>
              <Link href="/blog" className="rounded-full px-4 py-2 transition hover:bg-emerald-400/10 hover:text-emerald-100">
                Blog
              </Link>
              <Link
                href={`${routes.home}#search`}
                className="rounded-full px-4 py-2 transition hover:bg-emerald-400/10 hover:text-emerald-100"
              >
                Search
              </Link>
              <Link
                href={`${routes.home}#insights`}
                className="rounded-full px-4 py-2 transition hover:bg-emerald-400/10 hover:text-emerald-100"
              >
                Insights
              </Link>
              <Link
                href={routes.login}
                className="rounded-full border border-emerald-300/40 bg-emerald-500/15 px-5 py-2 font-semibold text-emerald-100 transition hover:border-emerald-200/70 hover:bg-emerald-400/20"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
