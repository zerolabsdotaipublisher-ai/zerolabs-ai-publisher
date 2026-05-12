import Image from "next/image";
import Link from "next/link";
import { routes } from "@/config/routes";

interface MarketingNavProps {
  currentPath?: string;
}

const navigationItems = [
  { label: "Product", section: "product" },
  { label: "Platform", section: "platform" },
  { label: "Insights", section: "insights" },
  { label: "Pricing", section: "pricing" },
] as const;

const wrapperClass = "mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-10 xl:px-12";

export function MarketingNav({ currentPath = "/" }: MarketingNavProps) {
  const resolveHref = (section: string) => (currentPath === "/" ? `#${section}` : `/#${section}`);

  return (
    <header className="relative z-30 pt-6 sm:pt-8">
      <div className={wrapperClass}>
        <div className="rounded-[2rem] border border-white/12 bg-slate-950/70 px-4 py-4 shadow-[0_25px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 lg:grid lg:grid-cols-[auto_1fr_auto] lg:gap-6">
            <Link href={routes.home} className="flex items-center gap-3 text-sm font-semibold tracking-[0.28em] text-white uppercase">
              <Image src="/images/Chip Icon Logo.svg" alt="ZeroLabsAI" width={44} height={44} className="shrink-0" priority />
              <span className="hidden sm:inline">ZeroLabsAI</span>
            </Link>

            <nav
              aria-label="Primary navigation"
              className="order-3 flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[11px] font-medium tracking-[0.35em] text-slate-300 uppercase lg:order-2 lg:w-auto lg:gap-x-10"
            >
              {navigationItems.map((item) => (
                <Link key={item.label} href={resolveHref(item.section)} className="transition hover:text-emerald-200">
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="order-2 flex flex-1 flex-wrap items-center justify-end gap-3 lg:order-3 lg:flex-none">
              <label className="relative min-w-[180px] flex-1 sm:min-w-[220px] lg:w-[220px] lg:flex-none">
                <span className="sr-only">Search</span>
                <Image
                  src="/images/Search Icon Light.svg"
                  alt=""
                  width={18}
                  height={18}
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-4 h-[18px] w-[18px] -translate-y-1/2 opacity-70"
                />
                <input
                  type="search"
                  aria-label="Search"
                  placeholder="SEARCH"
                  className="h-11 w-full rounded-full border border-white/12 bg-white/[0.04] pr-4 pl-11 text-xs tracking-[0.32em] text-white uppercase placeholder:text-slate-500 focus:border-emerald-300/60 focus:outline-none"
                />
              </label>
              <Link
                href={routes.login}
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/12 bg-white px-5 text-xs font-semibold tracking-[0.28em] text-slate-950 uppercase transition hover:bg-emerald-100"
              >
                Login
              </Link>
              <Link
                href={routes.signup}
                className="inline-flex h-11 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-400/12 px-5 text-xs font-semibold tracking-[0.28em] text-emerald-50 uppercase transition hover:border-emerald-300/45 hover:bg-emerald-300/18"
              >
                Signup
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
