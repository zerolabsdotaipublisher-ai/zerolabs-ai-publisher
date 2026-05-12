import Image from "next/image";
import Link from "next/link";
import { routes } from "@/config/routes";
import { MarketingTheme } from "./theme-toggle";

const footerLinks = [
  { label: "Product", href: `${routes.home}#product` },
  { label: "Platform", href: `${routes.home}#platform` },
  { label: "Insights", href: `${routes.home}#insights` },
  { label: "Pricing", href: `${routes.home}#pricing` },
  { label: "Blog", href: "/blog" },
] as const;

const shellClass = "mx-auto w-full max-w-[1440px] px-5 sm:px-6 lg:px-10 xl:px-12";

interface MarketingFooterProps {
  contained?: boolean;
  theme?: MarketingTheme;
}

export function MarketingFooter({ contained = false, theme = "light" }: MarketingFooterProps) {
  const isDark = theme === "dark";
  const logoSrc = isDark ? "/images/Zero Labs Logo transparent.svg" : "/images/Zero Labs Logo colored.svg";

  const content = (
    <footer
      className={[
        "rounded-[32px] border px-6 py-8 shadow-[0_24px_70px_rgba(18,65,112,0.10)] backdrop-blur-xl transition-colors duration-300 sm:px-8 lg:px-10",
        isDark
          ? "border-white/10 bg-[rgba(6,19,31,0.82)] text-[#F8F9FA]"
          : "border-[#1F6F5F]/14 bg-[rgba(234,242,239,0.82)] text-[#2C3E50]",
      ].join(" ")}
    >
      <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-4">
          <div className="flex items-center gap-3">
            <Image src={logoSrc} alt="Zero Labs AI Publisher logo" width={180} height={40} className="h-10 w-auto" />
            <span className="text-sm font-semibold tracking-[0.14em] text-current sm:text-base">Zero Labs AI Publisher</span>
          </div>
          <p className="max-w-xl text-2xl font-semibold leading-tight sm:text-3xl">
            Zero Labs AI Publisher is built by Zero Labs for AI-powered publishing operations.
          </p>
          <p className={isDark ? "text-[#F8F9FA]/70" : "text-[#2C3E50]/72"}>
            Prompt-led websites, publishing workflow oversight, and brand-safe automation surfaces stay aligned inside one calm green product system.
          </p>
        </div>

        <div className="flex flex-col items-start gap-4 lg:items-end">
          <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.22em] sm:text-sm">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={[
                  "rounded-full border px-4 py-2 transition-colors duration-300",
                  isDark
                    ? "border-white/10 text-[#F8F9FA]/72 hover:border-[#1F6F5F]/70 hover:bg-[#1F6F5F]/16 hover:text-[#F8F9FA]"
                    : "border-[#124170]/12 text-[#124170] hover:border-[#1F6F5F]/35 hover:bg-[#F8F9FA]",
                ].join(" ")}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={routes.login}
              className={[
                "inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-semibold transition-colors duration-300",
                isDark
                  ? "border border-white/12 bg-white/[0.05] text-[#F8F9FA] hover:border-[#1F6F5F]/70 hover:bg-[#1F6F5F]/16"
                  : "border border-[#1F6F5F]/14 bg-[#F8F9FA] text-[#124170] hover:border-[#1F6F5F]/35 hover:bg-[#F8F9FA]",
              ].join(" ")}
            >
              Login
            </Link>
            <Link
              href={routes.signup}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#1F6F5F] px-6 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#18584b]"
            >
              Signup
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );

  if (contained) {
    return content;
  }

  return <div className={`${shellClass} pb-8 sm:pb-10`}>{content}</div>;
}
