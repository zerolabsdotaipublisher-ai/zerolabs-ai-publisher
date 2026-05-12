import Image from "next/image";
import Link from "next/link";
import { routes } from "@/config/routes";

const footerLinks = [
  { label: "Product", href: `${routes.home}#product` },
  { label: "Platform", href: `${routes.home}#platform` },
  { label: "Insights", href: `${routes.home}#insights` },
  { label: "Pricing", href: `${routes.home}#pricing` },
  { label: "Blog", href: "/blog" },
] as const;

const wrapperClass = "mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-10 xl:px-12";

export function MarketingFooter() {
  return (
    <footer className="pb-8 sm:pb-10">
      <div className={wrapperClass}>
        <div className="rounded-[2rem] border border-white/12 bg-slate-950/70 px-6 py-8 text-slate-300 shadow-[0_20px_70px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:px-8 lg:px-10 lg:py-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center gap-3 text-sm font-semibold tracking-[0.28em] text-white uppercase">
                <Image src="/images/Chip Icon Logo.svg" alt="ZeroLabsAI" width={44} height={44} className="h-11 w-11" />
                <span>ZeroLabsAI</span>
              </div>
              <p className="max-w-xl text-2xl leading-tight font-semibold text-white sm:text-3xl">
                Premium AI publishing infrastructure built for prompt-led website generation and automated release workflows.
              </p>
              <p className="max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                Keep the homepage cinematic up front, then move into platform structure, insights, and pricing without breaking the public routes that already exist.
              </p>
            </div>

            <div className="flex flex-col items-start gap-4 lg:items-end">
              <div className="flex flex-wrap gap-3 text-xs tracking-[0.28em] uppercase sm:text-sm">
                {footerLinks.map((link) => (
                  <Link key={link.label} href={link.href} className="rounded-full border border-white/10 px-4 py-2 transition hover:border-emerald-300/40 hover:text-emerald-100">
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={routes.login}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-xs font-semibold tracking-[0.28em] text-slate-950 uppercase transition hover:bg-emerald-100"
                >
                  Login
                </Link>
                <Link
                  href={routes.signup}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-300/25 bg-emerald-400/12 px-6 text-xs font-semibold tracking-[0.28em] text-emerald-50 uppercase transition hover:border-emerald-300/45 hover:bg-emerald-300/18"
                >
                  Start building
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
