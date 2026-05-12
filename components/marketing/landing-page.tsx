"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { routes } from "@/config/routes";
import { MarketingFooter } from "./marketing-footer";
import { MarketingNav } from "./marketing-nav";
import { MarketingTheme } from "./theme-toggle";

type FeatureCard = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  lightAsset: string;
  darkAsset: string;
};

type StorySection = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  cards: Array<{
    title: string;
    description: string;
  }>;
};

type PricingTier = {
  name: string;
  summary: string;
  detail: string;
  features: string[];
};

const shellClass = "mx-auto w-full max-w-[1440px] px-5 sm:px-6 lg:px-10 xl:px-12";
const THEME_STORAGE_KEY = "zero-labs-ai-publisher-theme";
const headingClass = "font-[family:var(--font-heading)]";
const shellStyle = {
  marginInline: "auto",
  width: "100%",
  maxWidth: "1440px",
  paddingInline: "clamp(20px, 3vw, 48px)",
};

const featureCards: FeatureCard[] = [
  {
    id: "platform",
    eyebrow: "AI website generation",
    title: "AI Website Generation",
    description: "Turn a single prompt into a public-ready website with balanced layout, brand-led storytelling, and launch-ready page structure.",
    ctaLabel: "Explore platform",
    href: "#platform-story",
    lightAsset: "/images/AI robot logo light.svg",
    darkAsset: "/images/AI robot logo dark.svg",
  },
  {
    id: "workflow",
    eyebrow: "Publishing workflow",
    title: "Automated Publishing Workflow",
    description: "Guide teams from brief to review to release with a calmer operating surface that keeps automation visible without feeling like a dashboard.",
    ctaLabel: "View insights",
    href: "#insights",
    lightAsset: "/images/Banner Light.svg",
    darkAsset: "/images/Banner.svg",
  },
];

const storySections: StorySection[] = [
  {
    id: "platform-story",
    eyebrow: "Platform",
    title: "Keep the homepage human, then reveal the operating system below the fold.",
    description: "The public story stays centered and spacious while deeper sections explain how Zero Labs AI Publisher supports prompt intake, human review, and release control.",
    cards: [
      {
        title: "Prompt-to-site structure",
        description: "Capture brand direction once and turn it into publishable sections, polished copy blocks, and reusable page scaffolding.",
      },
      {
        title: "Human approval flow",
        description: "Review checkpoints stay visible so teams can guide the system without losing the speed gains of automation.",
      },
      {
        title: "Release orchestration",
        description: "Coordinate launches, edits, and updates across public surfaces from one calmer publishing workflow.",
      },
    ],
  },
  {
    id: "insights",
    eyebrow: "Insights",
    title: "Use a measured signal layer instead of a cramped metrics dashboard.",
    description: "A few anchored proof points support the narrative while preserving the premium feel of the homepage.",
    cards: [
      {
        title: "Website launch cadence",
        description: "Publish website iterations faster while keeping positioning, layout rhythm, and approvals aligned.",
      },
      {
        title: "Editorial confidence",
        description: "Shorter review loops and clearer ownership help human teams stay in control of AI output.",
      },
      {
        title: "Cross-surface consistency",
        description: "Brand-safe content structure extends from landing pages to blog and downstream publishing surfaces.",
      },
    ],
  },
];

const pricingTiers: PricingTier[] = [
  {
    name: "Starter",
    summary: "Launch a prompt-to-site workflow.",
    detail: "For focused teams shaping one polished AI website with guided review and clean publishing handoff.",
    features: ["Prompt-led website generation", "Core publishing workflow", "Workspace access for launch teams"],
  },
  {
    name: "Growth",
    summary: "Expand into coordinated publishing.",
    detail: "For teams layering in approval motion, content depth, and a more disciplined operational rhythm.",
    features: ["Multi-surface publishing control", "Human approval checkpoints", "Reusable product and insight sections"],
  },
  {
    name: "Platform",
    summary: "Operate a premium AI publishing engine.",
    detail: "For organizations positioning Zero Labs AI Publisher as the orchestration layer for AI-led web operations.",
    features: ["Brand-governed automation", "Executive-ready product posture", "Operational visibility across launches"],
  },
];

function resolveInitialTheme(): MarketingTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function LandingPage() {
  const [theme, setTheme] = useState<MarketingTheme>("light");
  const hasInitializedTheme = useRef(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const initialTheme = resolveInitialTheme();
      hasInitializedTheme.current = true;
      setTheme(initialTheme);
      document.documentElement.dataset.theme = initialTheme;
      document.documentElement.style.colorScheme = initialTheme;
      window.localStorage.setItem(THEME_STORAGE_KEY, initialTheme);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!hasInitializedTheme.current) {
      return;
    }

    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const isDark = theme === "dark";
  const heroAccentLogo = isDark ? "/images/AI robot logo dark.svg" : "/images/AI robot logo light.svg";

  return (
    <main
      className={[
        "min-h-screen overflow-x-hidden transition-colors duration-300",
        isDark ? "bg-[#071A16] text-[#F8F9FA]" : "bg-[#F8F9FA] text-[#2C3E50]",
      ].join(" ")}
      >
        <div
          className={[
            "pointer-events-none fixed inset-0",
          isDark
            ? "bg-[radial-gradient(circle_at_top,_rgba(31,111,95,0.22),_transparent_34%),radial-gradient(circle_at_80%_12%,_rgba(18,65,112,0.22),_transparent_28%),linear-gradient(180deg,#071A16_0%,#06131F_100%)]"
            : "bg-[radial-gradient(circle_at_top,_rgba(31,111,95,0.10),_transparent_35%),radial-gradient(circle_at_84%_10%,_rgba(18,65,112,0.08),_transparent_28%),linear-gradient(180deg,#F8F9FA_0%,#F3F7F4_100%)]",
        ].join(" ")}
        />

      <div
        className={`${shellClass} relative pt-[24px] pb-[32px] md:pt-[32px] md:pb-[40px] lg:pb-[48px]`}
        style={{ ...shellStyle, paddingTop: "clamp(24px, 3vw, 32px)", paddingBottom: "clamp(32px, 4vw, 48px)" }}
      >
        <MarketingNav currentPath="/" contained theme={theme} onToggleTheme={() => setTheme(isDark ? "light" : "dark")} />

        <section
          id="product"
          className={[
            "relative mt-[32px] overflow-hidden rounded-[40px] border shadow-[0_30px_90px_rgba(18,65,112,0.16)] transition-colors duration-300 sm:mt-[40px] xl:rounded-[48px]",
            isDark
              ? "border-[#1F6F5F]/45 bg-[rgba(31,111,95,0.14)]"
              : "border-[#124170]/16 bg-[rgba(234,242,239,0.74)]",
          ].join(" ")}
          style={{ marginTop: "clamp(32px, 4vw, 40px)", padding: "clamp(32px, 5vw, 64px)" }}
        >
          <div className={[
            "absolute inset-0",
            isDark
              ? "bg-[linear-gradient(110deg,rgba(6,19,31,0.92)_0%,rgba(7,26,22,0.88)_48%,rgba(6,19,31,0.38)_100%)]"
              : "bg-[linear-gradient(110deg,rgba(248,249,250,0.92)_0%,rgba(234,242,239,0.88)_48%,rgba(234,242,239,0.44)_100%)]",
          ].join(" ")} />
          <div className={isDark ? "absolute inset-0 bg-[radial-gradient(circle_at_left_center,rgba(31,111,95,0.18),transparent_36%)]" : "absolute inset-0 bg-[radial-gradient(circle_at_left_center,rgba(31,111,95,0.12),transparent_38%)]"} />

          <Image
            src="/images/FULL ROBOT BODY.svg"
            alt=""
            width={820}
            height={1080}
            priority
            className="pointer-events-none absolute bottom-0 left-1/2 h-auto w-[70%] max-w-[320px] -translate-x-1/2 object-contain opacity-10 sm:max-w-[380px] lg:hidden"
          />

          <div className="relative z-10 grid gap-12 lg:grid-cols-[minmax(0,0.96fr)_minmax(280px,0.82fr)] lg:items-center lg:gap-14 xl:gap-16">
            <div className="max-w-[760px]">
              <div style={{ display: "grid", gap: "24px" }}>
                <div className="inline-flex items-center gap-3 rounded-full border border-[#1F6F5F]/20 bg-white/20 px-[16px] py-[8px] text-sm font-semibold tracking-[0.14em] text-current backdrop-blur-sm">
                  <Image src={heroAccentLogo} alt="" width={32} height={32} className="h-8 w-8" priority />
                  <span>Zero Labs AI Publisher</span>
                </div>

                <p className={[
                  "text-sm font-semibold uppercase tracking-[0.32em]",
                  isDark ? "text-[#F8F9FA]/68" : "text-[#124170]/70",
                ].join(" ")}>
                  Sustainable & humanistic AI publishing
                </p>
                <h1 className={`${headingClass} max-w-[760px] text-5xl font-black leading-[1] tracking-[-0.04em] sm:text-6xl lg:text-7xl xl:text-[5.5rem]`}>
                  <span className="block">Turn prompts into</span>
                  <span className="block">published AI websites</span>
                </h1>
                <p className={[
                  "max-w-xl text-base leading-7 sm:text-lg",
                  isDark ? "text-[#F8F9FA]/76" : "text-[#2C3E50]/78",
                ].join(" ")}>
                  Zero Labs AI Publisher transforms a prompt into a polished website and guides the publishing workflow all the way to release.
                </p>
              </div>

              <div className="mt-[32px] flex flex-col gap-4 sm:mt-[40px] sm:flex-row sm:flex-wrap" style={{ marginTop: "clamp(32px, 4vw, 40px)" }}>
                <Link
                  href={routes.signup}
                  className="inline-flex min-h-14 items-center justify-center rounded-full bg-[#1F6F5F] text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#18584b]"
                  style={{ padding: "16px 32px" }}
                >
                  Start building
                </Link>
                <Link
                  href="#platform"
                  className={[
                    "inline-flex min-h-14 items-center justify-center rounded-full border text-sm font-semibold transition-colors duration-300",
                    isDark
                      ? "border-[#1F6F5F]/38 bg-white/[0.04] text-[#F8F9FA] hover:border-[#1F6F5F]/70 hover:bg-[#1F6F5F]/16"
                      : "border-[#124170]/18 bg-transparent text-[#124170] hover:border-[#1F6F5F]/40 hover:bg-[rgba(234,242,239,0.72)]",
                  ].join(" ")}
                  style={{ padding: "16px 32px" }}
                >
                  Learn more
                </Link>
              </div>
            </div>

            <div className="relative hidden min-h-[460px] lg:block">
              <Image
                src="/images/FULL ROBOT BODY.svg"
                alt=""
                width={820}
                height={1080}
                priority
                className="pointer-events-none absolute right-0 bottom-0 h-auto max-h-[640px] w-auto max-w-[100%] object-contain opacity-95 xl:max-h-[680px]"
              />
            </div>
          </div>
        </section>

        <section
          id="platform"
          className="mt-[32px] grid gap-6 sm:mt-[40px] lg:grid-cols-2 lg:gap-10"
          style={{ marginTop: "clamp(32px, 4vw, 40px)" }}
        >
          {featureCards.map((card) => (
            <article
              key={card.title}
              className={[
                "group relative min-h-[320px] overflow-hidden rounded-[32px] border shadow-[0_18px_48px_rgba(18,65,112,0.08)] transition-[background-color,border-color,color,box-shadow] duration-300 hover:shadow-[0_20px_60px_rgba(31,111,95,0.18)]",
                isDark
                  ? "border-[#1F6F5F]/30 bg-transparent hover:border-[#1F6F5F]/52 hover:bg-[rgba(31,111,95,0.16)]"
                  : "border-[#124170]/12 bg-transparent hover:border-[#1F6F5F]/28 hover:bg-[rgba(234,242,239,0.72)]",
              ].join(" ")}
              style={{ padding: "clamp(32px, 4vw, 40px)" }}
            >
              <div className={[
                "absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                isDark ? "bg-[radial-gradient(circle_at_top_right,rgba(31,111,95,0.22),transparent_36%)]" : "bg-[radial-gradient(circle_at_top_right,rgba(18,65,112,0.10),transparent_36%)]",
              ].join(" ")} />
              <Image
                src={isDark ? card.darkAsset : card.lightAsset}
                alt=""
                width={220}
                height={220}
                className="pointer-events-none absolute right-[24px] bottom-[24px] h-24 w-auto opacity-30 transition-opacity duration-300 group-hover:opacity-45 sm:h-28"
              />
              <div className="relative flex h-full flex-col justify-between gap-8">
                <div style={{ display: "grid", gap: "20px" }}>
                  <p className={[
                    "text-sm font-semibold uppercase tracking-[0.28em]",
                    isDark ? "text-[#F8F9FA]/62" : "text-[#124170]/68",
                  ].join(" ")}>
                    {card.eyebrow}
                  </p>
                  <h2 className={`${headingClass} max-w-[16ch] text-3xl font-semibold leading-tight sm:text-4xl`}>
                    {card.title}
                  </h2>
                  <p className={[
                    "max-w-xl text-base leading-7",
                    isDark ? "text-[#F8F9FA]/74" : "text-[#2C3E50]/76",
                  ].join(" ")}>
                    {card.description}
                  </p>
                </div>
                <Link
                  href={card.href}
                  className={[
                    "inline-flex w-fit min-h-12 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-300",
                    isDark
                      ? "border border-[#1F6F5F]/38 bg-white/[0.04] text-[#F8F9FA] hover:border-[#1F6F5F]/70 hover:bg-[#1F6F5F]/16"
                      : "border border-[#1F6F5F]/18 bg-[#F8F9FA] text-[#124170] hover:border-[#1F6F5F]/38 hover:bg-[#EAF2EF]",
                  ].join(" ")}
                  style={{ padding: "12px 28px" }}
                >
                  {card.ctaLabel}
                </Link>
              </div>
            </article>
          ))}
        </section>

        <div className="mt-[48px] space-y-12 sm:mt-[64px] lg:space-y-16" style={{ marginTop: "clamp(48px, 6vw, 64px)" }}>
          {storySections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className={[
                "rounded-[40px] border backdrop-blur-xl transition-colors duration-300",
                isDark ? "border-[#1F6F5F]/26 bg-[rgba(18,65,112,0.20)]" : "border-[#124170]/10 bg-[rgba(248,249,250,0.56)]",
              ].join(" ")}
              style={{ padding: "clamp(32px, 4vw, 40px)" }}
            >
              <div className="max-w-3xl" style={{ display: "grid", gap: "20px" }}>
                <p className={[
                  "text-sm font-semibold uppercase tracking-[0.32em]",
                  isDark ? "text-[#F8F9FA]/62" : "text-[#124170]/68",
                ].join(" ")}>
                  {section.eyebrow}
                </p>
                <h2 className={`${headingClass} text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl`}>
                  {section.title}
                </h2>
                <p className={[
                  "max-w-3xl text-base leading-7 sm:text-lg",
                  isDark ? "text-[#F8F9FA]/74" : "text-[#2C3E50]/76",
                ].join(" ")}>
                  {section.description}
                  </p>
              </div>

              <div className="mt-[40px] grid gap-6 sm:gap-8 lg:grid-cols-3 lg:gap-8" style={{ marginTop: "40px" }}>
                {section.cards.map((card) => (
                  <article
                    key={card.title}
                    className={[
                      "min-h-[220px] rounded-[32px] border transition-[background-color,border-color,color,box-shadow] duration-300 hover:shadow-[0_18px_50px_rgba(31,111,95,0.16)]",
                      isDark
                        ? "border-[#1F6F5F]/22 bg-transparent hover:border-[#1F6F5F]/44 hover:bg-[rgba(31,111,95,0.16)]"
                        : "border-[#124170]/10 bg-transparent hover:border-[#1F6F5F]/24 hover:bg-[rgba(234,242,239,0.72)]",
                    ].join(" ")}
                    style={{ padding: "32px" }}
                  >
                    <div style={{ display: "grid", gap: "16px" }}>
                      <h3 className={`${headingClass} text-2xl font-semibold`}>{card.title}</h3>
                      <p className={[isDark ? "text-[#F8F9FA]/72" : "text-[#2C3E50]/74", "text-base leading-7"].join(" ")}>
                        {card.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}

          <section
            id="pricing"
            className={[
              "rounded-[40px] border backdrop-blur-xl transition-colors duration-300",
              isDark ? "border-[#1F6F5F]/26 bg-[rgba(18,65,112,0.20)]" : "border-[#124170]/10 bg-[rgba(248,249,250,0.56)]",
            ].join(" ")}
            style={{ padding: "clamp(32px, 4vw, 40px)" }}
          >
            <div className="max-w-3xl" style={{ display: "grid", gap: "20px" }}>
              <p className={[
                "text-sm font-semibold uppercase tracking-[0.32em]",
                isDark ? "text-[#F8F9FA]/62" : "text-[#124170]/68",
              ].join(" ")}>
                Pricing
              </p>
              <h2 className={`${headingClass} text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl`}>
                Three pricing paths for teams growing into AI-powered publishing operations.
              </h2>
              <p className={[
                "max-w-3xl text-base leading-7 sm:text-lg",
                isDark ? "text-[#F8F9FA]/74" : "text-[#2C3E50]/76",
              ].join(" ")}>
                Each tier keeps the homepage public-facing and calm while expanding how much of the publishing workflow Zero Labs AI Publisher can orchestrate.
              </p>
            </div>

            <div className="mt-[40px] grid gap-6 sm:gap-8 lg:grid-cols-3 lg:gap-8" style={{ marginTop: "40px" }}>
              {pricingTiers.map((tier) => (
                <article
                  key={tier.name}
                  className={[
                    "flex min-h-[320px] flex-col rounded-[32px] border transition-[background-color,border-color,color,box-shadow] duration-300 hover:shadow-[0_18px_50px_rgba(31,111,95,0.16)]",
                    isDark
                      ? "border-[#1F6F5F]/22 bg-transparent hover:border-[#1F6F5F]/44 hover:bg-[rgba(31,111,95,0.16)]"
                      : "border-[#124170]/10 bg-transparent hover:border-[#1F6F5F]/24 hover:bg-[rgba(234,242,239,0.72)]",
                  ].join(" ")}
                  style={{ padding: "32px" }}
                >
                  <div style={{ display: "grid", gap: "20px" }}>
                    <p className={[
                      "text-sm font-semibold uppercase tracking-[0.28em]",
                      isDark ? "text-[#F8F9FA]/62" : "text-[#124170]/68",
                    ].join(" ")}>
                      {tier.name}
                    </p>
                    <h3 className={`${headingClass} text-2xl font-semibold`}>{tier.summary}</h3>
                    <p className={[
                      "text-base leading-7",
                      isDark ? "text-[#F8F9FA]/72" : "text-[#2C3E50]/74",
                    ].join(" ")}>
                      {tier.detail}
                    </p>
                  </div>
                  <ul className="mt-[24px] space-y-[16px] text-sm leading-6 sm:text-base" style={{ marginTop: "24px" }}>
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#1F6F5F]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-[32px]">
                    <Link
                      href={routes.signup}
                      className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#1F6F5F] text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#18584b]"
                      style={{ padding: "12px 28px" }}
                    >
                      Choose {tier.name}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-[64px] sm:mt-[80px]" style={{ marginTop: "clamp(64px, 8vw, 80px)" }}>
          <MarketingFooter contained theme={theme} />
        </div>
      </div>
    </main>
  );
}
