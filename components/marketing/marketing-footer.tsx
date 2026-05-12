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
  { label: "Login", href: routes.login },
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
        "rounded-[32px] border p-8 shadow-[0_24px_70px_rgba(18,65,112,0.10)] backdrop-blur-xl transition-colors duration-300 sm:p-10",
        isDark
          ? "border-[#1F6F5F]/28 bg-[linear-gradient(135deg,rgba(6,19,31,0.92),rgba(7,26,22,0.88))] text-[#F8F9FA]"
          : "border-[#124170]/14 bg-[linear-gradient(135deg,rgba(234,242,239,0.84),rgba(248,249,250,0.92))] text-[#2C3E50]",
      ].join(" ")}
    >
      <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <div className="max-w-2xl space-y-5">
          <div className="flex items-center gap-3">
            <Image src={logoSrc} alt="" width={180} height={40} className="h-10 w-auto" />
            <span className="font-[family:var(--font-heading)] text-sm font-semibold tracking-[0.1em] text-current sm:text-base">
              Zero Labs AI Publisher
            </span>
          </div>
          <p className="max-w-xl font-[family:var(--font-heading)] text-2xl font-semibold leading-tight sm:text-3xl">
            Zero Labs AI Publisher
          </p>
          <p className={["max-w-xl text-base leading-7 sm:text-lg", isDark ? "text-[#F8F9FA]/72" : "text-[#2C3E50]/76"].join(" ")}>
            AI-powered publishing infrastructure for sustainable, humanistic digital operations.
          </p>
          <p className={["text-sm", isDark ? "text-[#F8F9FA]/62" : "text-[#2C3E50]/62"].join(" ")}>
            © 2026 Zero Labs AI Publisher. Built by Zero Labs.
          </p>
        </div>

        <div className="flex flex-col items-start gap-5 lg:items-end">
          <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.22em] sm:text-sm">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={[
                  "rounded-full border px-4 py-2 transition-colors duration-300",
                  isDark
                    ? "border-white/10 text-[#F8F9FA]/72 hover:border-[#1F6F5F]/70 hover:bg-[#1F6F5F]/16 hover:text-[#F8F9FA]"
                    : "border-[#124170]/12 text-[#124170] hover:border-[#1F6F5F]/35 hover:bg-[rgba(31,111,95,0.08)]",
                ].join(" ")}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={routes.signup}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#1F6F5F] px-6 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#18584b]"
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
    <div className={`${shellClass} pb-8 sm:pb-10`}>
      {content}
    </div>
  );
}
