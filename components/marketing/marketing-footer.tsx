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

const wrapperClass = "mx-auto w-full max-w-[1600px] px-[16px] sm:px-[24px] lg:px-[40px]";

interface MarketingFooterProps {
  contained?: boolean;
}

export function MarketingFooter({ contained = false }: MarketingFooterProps) {
  const content = (
    <footer className="rounded-[2rem] border border-white/12 bg-[#081b31]/85 px-[24px] py-[32px] text-slate-300 shadow-[0_20px_70px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:px-[32px] lg:px-[40px] lg:py-[40px]">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-4">
          <div className="flex items-center gap-3 text-sm font-semibold tracking-[0.28em] text-white uppercase">
            <Image src="/images/Chip Icon Logo.svg" alt="ZeroLabsAI" width={44} height={44} className="shrink-0" />
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
                <Link key={link.label} href={link.href} className="rounded-full border border-white/10 px-[16px] py-[8px] transition hover:border-slate-200/50 hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={routes.login}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-100 px-[24px] text-xs font-semibold tracking-[0.28em] text-slate-950 uppercase transition hover:bg-white"
            >
              Login
            </Link>
            <Link
              href={routes.signup}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/12 bg-white/[0.08] px-[24px] text-xs font-semibold tracking-[0.28em] text-white uppercase transition hover:border-white/25 hover:bg-white/12"
            >
              Start building
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );

  if (contained) {
    return content;
  }

  return (
    <div className={`${wrapperClass} pb-[32px] sm:pb-[40px]`}>
      {content}
    </div>
  );
}
