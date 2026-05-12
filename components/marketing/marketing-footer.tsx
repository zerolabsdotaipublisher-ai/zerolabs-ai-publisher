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
const shellStyle = {
  marginInline: "auto",
  width: "100%",
  maxWidth: "1440px",
  paddingInline: "clamp(20px, 3vw, 48px)",
};

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
        "rounded-[40px] border shadow-[0_30px_100px_rgba(18,65,112,0.10)] backdrop-blur-2xl transition-colors duration-300",
        isDark
          ? "border-[#1F6F5F]/20 bg-[linear-gradient(135deg,rgba(6,19,31,0.90),rgba(7,26,22,0.82),rgba(18,65,112,0.38))] text-[#F8F9FA]"
          : "border-[#124170]/10 bg-[linear-gradient(135deg,rgba(248,249,250,0.82),rgba(234,242,239,0.88),rgba(18,65,112,0.08))] text-[#2C3E50]",
      ].join(" ")}
      style={{ padding: "clamp(36px, 5vw, 56px)" }}
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] lg:items-end lg:gap-16">
        <div className="max-w-2xl space-y-6">
          <div className="flex items-center gap-3">
            <Image src={logoSrc} alt="" width={180} height={40} className="h-10 w-auto" />
            <span className="font-[family:var(--font-heading)] text-sm font-semibold tracking-[0.1em] text-current sm:text-base">
              Zero Labs AI Publisher
            </span>
          </div>
          <p className={["text-xs font-medium tracking-[0.16em]", isDark ? "text-[#F8F9FA]/54" : "text-[#124170]/54"].join(" ")}>
            Sustainable AI · Editorial storytelling · Humanistic publishing
          </p>
          <p className="max-w-2xl font-[family:var(--font-heading)] text-3xl font-semibold leading-[1.08] sm:text-4xl lg:text-[2.9rem]">
            Zero Labs AI Publisher
          </p>
          <p className={["max-w-xl text-base leading-8 sm:text-lg", isDark ? "text-[#F8F9FA]/72" : "text-[#2C3E50]/76"].join(" ")}>
            AI-powered publishing infrastructure for sustainable, humanistic digital operations.
          </p>
          <p className={["text-sm", isDark ? "text-[#F8F9FA]/62" : "text-[#2C3E50]/62"].join(" ")}>
            © 2026 Zero Labs AI Publisher. Built by Zero Labs.
          </p>
        </div>

        <div className="flex flex-col items-start gap-6 lg:items-end">
          <div className="flex flex-wrap gap-3 text-sm font-medium tracking-[0.04em] lg:justify-end">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={[
                  "rounded-full border px-[18px] py-[10px] transition-colors duration-300",
                  isDark
                    ? "border-white/8 text-[#F8F9FA]/74 hover:border-[#1F6F5F]/55 hover:bg-[#1F6F5F]/12 hover:text-[#F8F9FA]"
                    : "border-[#124170]/10 text-[#124170] hover:border-[#1F6F5F]/30 hover:bg-[rgba(31,111,95,0.08)]",
                ].join(" ")}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={routes.signup}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#1F6F5F] text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#18584b]"
              style={{ paddingInline: "24px" }}
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
    <div className={`${shellClass} pb-[32px] sm:pb-[40px]`} style={{ ...shellStyle, paddingBottom: "clamp(32px, 4vw, 40px)" }}>
      {content}
    </div>
  );
}
