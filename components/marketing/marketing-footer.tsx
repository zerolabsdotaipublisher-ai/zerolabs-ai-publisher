import Link from "next/link";
import { routes } from "@/config/routes";

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="font-medium text-slate-100">Zero Labs AI Publisher</p>
          <p>AI-native publishing infrastructure for websites, blogs, portfolios, and social operations.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href={routes.home} className="transition hover:text-white">
            Home
          </Link>
          <Link href={`${routes.home}#about`} className="transition hover:text-white">
            About
          </Link>
          <Link href="/blog" className="transition hover:text-white">
            Blog
          </Link>
          <Link href={routes.login} className="transition hover:text-white">
            Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
