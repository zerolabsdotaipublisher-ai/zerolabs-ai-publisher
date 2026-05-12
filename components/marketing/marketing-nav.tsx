import Image from "next/image";
import Link from "next/link";
import { routes } from "@/config/routes";

interface MarketingNavProps {
  currentPath?: string;
  contained?: boolean;
}

const navigationItems = [
  { label: "Product", section: "product" },
  { label: "Platform", section: "platform" },
  { label: "Insights", section: "insights" },
  { label: "Pricing", section: "pricing" },
] as const;

const wrapperClass = "mx-auto w-full max-w-[1600px] px-[16px] sm:px-[24px] lg:px-[40px]";

export function MarketingNav({ currentPath = "/", contained = false }: MarketingNavProps) {
  const resolveHref = (section: string) => (currentPath === "/" ? `#${section}` : `/#${section}`);
  const content = (
    <header className="rounded-3xl border border-white/15 bg-[#0b2038]/80 px-[20px] py-[16px] shadow-[0_25px_80px_rgba(2,6,23,0.45)] backdrop-blur">
      <div className="flex items-center justify-between gap-6">
        <Link href={routes.home} className="flex items-center gap-3 text-white">
          <Image src="/images/Chip Icon Logo.svg" alt="ZeroLabsAI" width={40} height={40} className="h-10 w-10 shrink-0" priority />
          <span className="text-sm font-black tracking-[0.3em] uppercase">ZeroLabsAI</span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-12 text-sm tracking-[0.3em] text-slate-300 uppercase lg:flex">
          {navigationItems.map((item) => (
            <Link key={item.label} href={resolveHref(item.section)} className="transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="rounded-full border border-white/15 px-[20px] py-[12px] text-xs tracking-[0.3em] text-slate-400 uppercase">Search</div>
          <Link
            href={routes.login}
            className="inline-flex items-center justify-center rounded-full bg-slate-100 px-[28px] py-[12px] text-xs font-black tracking-[0.3em] text-slate-950 uppercase transition hover:bg-white"
          >
            Login
          </Link>
          <Link
            href={routes.signup}
            className="inline-flex items-center justify-center rounded-full bg-slate-100 px-[28px] py-[12px] text-xs font-black tracking-[0.3em] text-slate-950 uppercase transition hover:bg-white"
          >
            Signup
          </Link>
        </div>
      </div>
    </header>
  );

  if (contained) {
    return content;
  }

  return <div className={`${wrapperClass} pt-[24px] sm:pt-[32px]`}>{content}</div>;
}
