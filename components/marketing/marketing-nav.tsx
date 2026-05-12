import Image from "next/image";
import Link from "next/link";
import { routes } from "@/config/routes";
import { MarketingTheme, ThemeToggle } from "./theme-toggle";

interface MarketingNavProps {
  currentPath?: string;
  contained?: boolean;
  theme?: MarketingTheme;
  onToggleTheme?: () => void;
}

const navigationItems: Array<{ label: string; href: string; desktopOnly?: boolean }> = [
  { label: "Product", href: "#product" },
  { label: "Platform", href: "#platform" },
  { label: "Insights", href: "#insights" },
  { label: "Pricing", href: "#pricing" },
  { label: "Blog", href: "/blog", desktopOnly: true },
] as const;

const shellClass = "mx-auto w-full max-w-[1440px] px-5 sm:px-6 lg:px-10 xl:px-12";
const shellStyle = {
  marginInline: "auto",
  width: "100%",
  maxWidth: "1440px",
  paddingInline: "clamp(20px, 3vw, 48px)",
};

export function MarketingNav({
  currentPath = "/",
  contained = false,
  theme = "light",
  onToggleTheme,
}: MarketingNavProps) {
  const isDark = theme === "dark";
  const logoSrc = isDark ? "/images/Zero Labs Logo transparent.svg" : "/images/Zero Labs Logo colored.svg";
  const searchIconSrc = isDark ? "/images/Search Icon Light.svg" : "/images/Search Icon Dark.svg";
  const resolveHref = (href: string) => {
    if (!href.startsWith("#")) {
      return href;
    }

    return currentPath === "/" ? href : `/${href}`;
  };

  const content = (
    <header
      className={[
        "rounded-[32px] border px-[16px] py-[16px] shadow-[0_24px_70px_rgba(18,65,112,0.12)] backdrop-blur-xl transition-colors duration-300 sm:px-[24px] lg:px-[32px]",
        isDark
          ? "border-white/10 bg-[rgba(7,26,22,0.88)] text-[#F8F9FA]"
          : "border-[#1F6F5F]/14 bg-[rgba(248,249,250,0.86)] text-[#2C3E50]",
      ].join(" ")}
      style={{ padding: "16px clamp(16px, 2vw, 32px)" }}
    >
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(240px,1fr)_auto_minmax(240px,1fr)] lg:items-center lg:gap-6">
        <div className="flex items-center justify-between gap-3 lg:justify-start">
          <Link href={routes.home} className="flex min-w-0 items-center gap-3">
            <Image
              src={logoSrc}
              alt=""
              width={180}
              height={40}
              priority
              className="h-10 w-auto shrink-0"
            />
            <span className="min-w-0 font-[family:var(--font-heading)] text-sm font-semibold tracking-[0.1em] text-current sm:text-base">
              Zero Labs AI Publisher
            </span>
          </Link>
        </div>

        <nav
          aria-label="Primary navigation"
          className={[
            "flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold uppercase tracking-[0.24em] sm:text-sm",
            isDark ? "text-[#F8F9FA]/72" : "text-[#2C3E50]/72",
          ].join(" ")}
        >
          {navigationItems.map((item) => (
            <Link
              key={item.label}
              href={resolveHref(item.href)}
              className={[
                "transition-colors duration-300 hover:text-current",
                item.desktopOnly ? "hidden xl:inline-flex" : "inline-flex",
              ].join(" ")}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <div
            className={[
              "hidden min-h-11 items-center gap-2 rounded-full border px-[16px] text-xs font-semibold uppercase tracking-[0.22em] md:inline-flex",
              isDark
                ? "border-white/10 bg-white/[0.04] text-[#F8F9FA]/78"
                : "border-[#124170]/12 bg-[#EAF2EF]/72 text-[#124170]",
            ].join(" ")}
          >
            <Image src={searchIconSrc} alt="" width={16} height={16} className="h-4 w-4" />
            <span>Search</span>
          </div>
          <Link
            href={routes.login}
            className={[
              "inline-flex min-h-11 items-center justify-center rounded-full px-[24px] text-sm font-semibold transition-colors duration-300",
              isDark
                ? "border border-white/12 bg-white/[0.05] text-[#F8F9FA] hover:border-[#1F6F5F]/70 hover:bg-[#1F6F5F]/16"
                : "border border-[#1F6F5F]/14 bg-[#F8F9FA] text-[#124170] hover:border-[#1F6F5F]/35 hover:bg-[#EAF2EF]",
            ].join(" ")}
            style={{ paddingInline: "24px" }}
          >
            Login
          </Link>
          <Link
            href={routes.signup}
            className={[
              "inline-flex min-h-11 items-center justify-center rounded-full px-[24px] text-sm font-semibold transition-colors duration-300",
              isDark
                ? "bg-[#1F6F5F] text-white hover:bg-[#18584b]"
                : "bg-[#1F6F5F] text-white hover:bg-[#18584b]",
            ].join(" ")}
            style={{ paddingInline: "24px" }}
          >
            Signup
          </Link>
          {onToggleTheme ? <ThemeToggle theme={theme} onToggle={onToggleTheme} /> : null}
        </div>
      </div>
    </header>
  );

  if (contained) {
    return content;
  }

  return (
    <div className={`${shellClass} pt-[24px] md:pt-[32px]`} style={{ ...shellStyle, paddingTop: "clamp(24px, 3vw, 32px)" }}>
      {content}
    </div>
  );
}
