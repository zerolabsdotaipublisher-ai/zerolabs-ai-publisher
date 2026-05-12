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
const sectionSpacing = "clamp(72px, 8vw, 112px)";

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
            ? "bg-[radial-gradient(circle_at_top,_rgba(31,111,95,0.18),_transparent_32%),radial-gradient(circle_at_80%_12%,_rgba(18,65,112,0.16),_transparent_30%),linear-gradient(180deg,#071A16_0%,#06131F_100%)]"
            : "bg-[radial-gradient(circle_at_top,_rgba(31,111,95,0.10),_transparent_38%),radial-gradient(circle_at_84%_10%,_rgba(18,65,112,0.08),_transparent_30%),linear-gradient(180deg,#F8F9FA_0%,#F4F7F5_100%)]",
        ].join(" ")}
      />

      <div
        className={`${shellClass} relative pt-[24px] pb-[32px] md:pt-[32px] md:pb-[40px] lg:pb-[48px]`}
        style={{ ...shellStyle, paddingTop: "clamp(32px, 5vw, 56px)", paddingBottom: "clamp(48px, 6vw, 72px)" }}
      >
        <MarketingNav currentPath="/" contained theme={theme} onToggleTheme={() => setTheme(isDark ? "light" : "dark")} />

        <section
          id="product"
          className={[
            "relative overflow-hidden rounded-[44px] border transition-colors duration-300 xl:rounded-[52px]",
            isDark
              ? "border-[#1F6F5F]/24 bg-[rgba(11,30,27,0.66)]"
              : "border-[#124170]/10 bg-[rgba(248,249,250,0.62)]",
          ].join(" ")}
          style={{
            marginTop: "clamp(48px, 6vw, 80px)",
            padding: "clamp(36px, 6vw, 84px)",
            minHeight: "clamp(620px, 70vw, 780px)",
            boxShadow: isDark ? "0 32px 120px rgba(3, 12, 20, 0.38)" : "0 32px 120px rgba(18, 65, 112, 0.12)",
          }}
        >
          <div
            className={[
              "absolute inset-0",
              isDark
                ? "bg-[linear-gradient(118deg,rgba(6,19,31,0.95)_0%,rgba(7,26,22,0.88)_48%,rgba(6,19,31,0.22)_100%)]"
                : "bg-[linear-gradient(118deg,rgba(248,249,250,0.96)_0%,rgba(234,242,239,0.84)_48%,rgba(234,242,239,0.24)_100%)]",
            ].join(" ")}
          />
          <div
            className={
              isDark
                ? "absolute inset-0 bg-[radial-gradient(circle_at_left_center,rgba(31,111,95,0.16),transparent_34%)]"
                : "absolute inset-0 bg-[radial-gradient(circle_at_left_center,rgba(31,111,95,0.10),transparent_36%)]"
            }
          />
          <div
            className={
              isDark
                ? "absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(18,65,112,0.24),transparent_30%)]"
                : "absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(18,65,112,0.12),transparent_32%)]"
            }
          />

          <Image
            src="/images/FULL ROBOT BODY.svg"
            alt=""
            width={820}
            height={1080}
            priority
            className="pointer-events-none absolute right-[-8%] bottom-[-8%] h-auto w-[72%] max-w-[320px] object-contain sm:max-w-[360px] lg:hidden"
            style={{ opacity: 0.09 }}
          />

          <div className="relative z-10 grid min-h-[inherit] gap-14 lg:grid-cols-[minmax(0,0.92fr)_minmax(320px,0.78fr)] lg:items-center">
            <div className="max-w-[640px] self-center">
              <div style={{ display: "grid", gap: "clamp(24px, 3vw, 32px)" }}>
                <div
                  className={[
                    "inline-flex w-fit items-center gap-3 rounded-full border px-[16px] py-[10px] text-sm font-semibold tracking-[0.08em] text-current backdrop-blur-md",
                    isDark ? "border-white/8 bg-white/[0.05]" : "border-[#124170]/10 bg-white/55",
                  ].join(" ")}
                >
                  <Image src={heroAccentLogo} alt="" width={32} height={32} className="h-8 w-8" priority />
                  <span>Zero Labs AI Publisher</span>
                </div>

                <p className={["max-w-md text-sm font-medium tracking-[0.08em]", isDark ? "text-[#F8F9FA]/68" : "text-[#124170]/70"].join(" ")}>
                  Sustainable & humanistic AI publishing
                </p>
                <h1
                  className={`${headingClass} max-w-[720px] text-[clamp(3.6rem,7vw,6.25rem)] font-semibold tracking-[-0.045em]`}
                  style={{ lineHeight: 0.92 }}
                >
                  Turn prompts
                  <br />
                  into published
                  <br />
                  AI websites
                </h1>
                <p
                  className={["max-w-[34rem] text-base sm:text-lg", isDark ? "text-[#F8F9FA]/76" : "text-[#2C3E50]/78"].join(" ")}
                  style={{ lineHeight: 1.9 }}
                >
                  Zero Labs AI Publisher transforms a prompt into a polished website and guides the publishing workflow all the way to release.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap" style={{ marginTop: "clamp(36px, 4vw, 52px)" }}>
                <Link
                  href={routes.signup}
                  className="inline-flex min-h-14 items-center justify-center rounded-full bg-[#1F6F5F] text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#18584b]"
                  style={{ padding: "16px 32px", boxShadow: "0 18px 50px rgba(31,111,95,0.18)" }}
                >
                  Start building
                </Link>
                <Link
                  href="#platform"
                  className={[
                    "inline-flex min-h-14 items-center justify-center rounded-full border text-sm font-semibold transition-colors duration-300",
                    isDark
                      ? "border-[#1F6F5F]/38 bg-white/[0.04] text-[#F8F9FA] hover:border-[#1F6F5F]/60 hover:bg-[#1F6F5F]/12"
                      : "border-[#124170]/14 bg-transparent text-[#124170] hover:border-[#1F6F5F]/30 hover:bg-[rgba(234,242,239,0.72)]",
                  ].join(" ")}
                  style={{ padding: "16px 32px" }}
                >
                  Learn more
                </Link>
              </div>
            </div>

            <div className="relative hidden min-h-[540px] lg:block">
              <Image
                src="/images/FULL ROBOT BODY.svg"
                alt=""
                width={820}
                height={1080}
                priority
                className="pointer-events-none absolute right-[-4%] bottom-[-6%] h-auto max-h-[560px] w-auto max-w-[92%] object-contain xl:max-h-[620px]"
                style={{ opacity: isDark ? 0.62 : 0.5 }}
              />
            </div>
          </div>
        </section>

        <section
          id="platform"
          className="grid gap-8 lg:grid-cols-2"
          style={{ marginTop: "clamp(56px, 8vw, 88px)", gap: "clamp(28px, 3vw, 48px)" }}
        >
          {featureCards.map((card) => (
            <article
              key={card.title}
              className={[
                "group relative min-h-[360px] overflow-hidden rounded-[36px] border transition-[background-color,border-color,color,box-shadow,transform] duration-300",
                isDark
                  ? "border-[#1F6F5F]/16 bg-transparent hover:border-[#1F6F5F]/32 hover:bg-[rgba(31,111,95,0.10)]"
                  : "border-[#124170]/8 bg-transparent hover:border-[#1F6F5F]/20 hover:bg-[rgba(234,242,239,0.66)]",
              ].join(" ")}
              style={{
                padding: "clamp(34px, 4vw, 48px)",
                boxShadow: isDark ? "0 18px 60px rgba(3, 12, 20, 0.18)" : "0 18px 60px rgba(18, 65, 112, 0.06)",
              }}
            >
              <div
                className={[
                  "absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                  isDark ? "bg-[radial-gradient(circle_at_top_right,rgba(31,111,95,0.18),transparent_38%)]" : "bg-[radial-gradient(circle_at_top_right,rgba(18,65,112,0.08),transparent_40%)]",
                ].join(" ")}
              />
              <Image
                src={isDark ? card.darkAsset : card.lightAsset}
                alt=""
                width={220}
                height={220}
                className="pointer-events-none absolute right-[28px] bottom-[28px] h-24 w-auto transition-opacity duration-300 group-hover:opacity-45 sm:h-28"
                style={{ opacity: isDark ? 0.22 : 0.24 }}
              />
              <div className="relative flex h-full flex-col justify-between" style={{ gap: "clamp(24px, 3vw, 42px)" }}>
                <div style={{ display: "grid", gap: "22px" }}>
                  <p className={["text-sm font-medium tracking-[0.08em]", isDark ? "text-[#F8F9FA]/62" : "text-[#124170]/68"].join(" ")}>
                    {card.eyebrow}
                  </p>
                  <h2 className={`${headingClass} max-w-[16ch] text-3xl font-semibold leading-tight sm:text-4xl`}>{card.title}</h2>
                  <p
                    className={["max-w-xl text-base", isDark ? "text-[#F8F9FA]/74" : "text-[#2C3E50]/76"].join(" ")}
                    style={{ lineHeight: 1.85 }}
                  >
                    {card.description}
                  </p>
                </div>
                <Link
                  href={card.href}
                  className={[
                    "inline-flex w-fit min-h-12 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-300",
                    isDark
                      ? "border border-[#1F6F5F]/30 bg-white/[0.04] text-[#F8F9FA] hover:border-[#1F6F5F]/55 hover:bg-[#1F6F5F]/12"
                      : "border border-[#1F6F5F]/16 bg-[#F8F9FA] text-[#124170] hover:border-[#1F6F5F]/30 hover:bg-[#EAF2EF]",
                  ].join(" ")}
                  style={{ padding: "12px 28px" }}
                >
                  {card.ctaLabel}
                </Link>
              </div>
            </article>
          ))}
        </section>

        <div className="space-y-12 lg:space-y-16" style={{ marginTop: sectionSpacing }}>
          {storySections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className={[
                "rounded-[40px] border backdrop-blur-xl transition-colors duration-300",
                isDark ? "border-[#1F6F5F]/18 bg-[rgba(18,65,112,0.18)]" : "border-[#124170]/8 bg-[rgba(248,249,250,0.50)]",
              ].join(" ")}
              style={{
                padding: "clamp(36px, 5vw, 56px)",
                boxShadow: isDark ? "0 20px 80px rgba(3, 12, 20, 0.12)" : "0 20px 80px rgba(18, 65, 112, 0.05)",
              }}
            >
              <div className="max-w-[760px]" style={{ display: "grid", gap: "22px" }}>
                <p className={["text-sm font-medium tracking-[0.08em]", isDark ? "text-[#F8F9FA]/62" : "text-[#124170]/68"].join(" ")}>
                  {section.eyebrow}
                </p>
                <h2 className={`${headingClass} text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl`}>{section.title}</h2>
                <p
                  className={["max-w-3xl text-base sm:text-lg", isDark ? "text-[#F8F9FA]/74" : "text-[#2C3E50]/76"].join(" ")}
                  style={{ lineHeight: 1.9 }}
                >
                  {section.description}
                </p>
              </div>

              <div className="grid gap-6 sm:gap-8 lg:grid-cols-3" style={{ marginTop: "clamp(40px, 4vw, 56px)", gap: "clamp(24px, 2.5vw, 36px)" }}>
                {section.cards.map((card) => (
                  <article
                    key={card.title}
                    className={[
                      "min-h-[240px] rounded-[32px] border transition-[background-color,border-color,color,box-shadow,transform] duration-300",
                      isDark
                        ? "border-[#1F6F5F]/14 bg-transparent hover:border-[#1F6F5F]/28 hover:bg-[rgba(31,111,95,0.10)]"
                        : "border-[#124170]/8 bg-transparent hover:border-[#1F6F5F]/18 hover:bg-[rgba(234,242,239,0.66)]",
                    ].join(" ")}
                    style={{
                      padding: "clamp(28px, 3vw, 36px)",
                      boxShadow: isDark ? "0 16px 48px rgba(3, 12, 20, 0.08)" : "0 16px 48px rgba(18, 65, 112, 0.04)",
                      background: isDark ? "rgba(14,32,42,0.28)" : "rgba(234,242,239,0.42)",
                    }}
                  >
                    <div style={{ display: "grid", gap: "18px" }}>
                      <h3 className={`${headingClass} text-2xl font-semibold`}>{card.title}</h3>
                      <p
                        className={[isDark ? "text-[#F8F9FA]/72" : "text-[#2C3E50]/74", "text-base"].join(" ")}
                        style={{ lineHeight: 1.85 }}
                      >
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
              isDark ? "border-[#1F6F5F]/18 bg-[rgba(18,65,112,0.18)]" : "border-[#124170]/8 bg-[rgba(248,249,250,0.50)]",
            ].join(" ")}
            style={{
              padding: "clamp(36px, 5vw, 56px)",
              boxShadow: isDark ? "0 20px 80px rgba(3, 12, 20, 0.12)" : "0 20px 80px rgba(18, 65, 112, 0.05)",
            }}
          >
            <div className="max-w-[760px]" style={{ display: "grid", gap: "22px" }}>
              <p className={["text-sm font-medium tracking-[0.08em]", isDark ? "text-[#F8F9FA]/62" : "text-[#124170]/68"].join(" ")}>
                Pricing
              </p>
              <h2 className={`${headingClass} text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl`}>
                Three pricing paths for teams growing into AI-powered publishing operations.
              </h2>
              <p
                className={["max-w-3xl text-base sm:text-lg", isDark ? "text-[#F8F9FA]/74" : "text-[#2C3E50]/76"].join(" ")}
                style={{ lineHeight: 1.9 }}
              >
                Each tier keeps the homepage public-facing and calm while expanding how much of the publishing workflow Zero Labs AI Publisher can orchestrate.
              </p>
            </div>

            <div className="grid gap-6 sm:gap-8 lg:grid-cols-3" style={{ marginTop: "clamp(40px, 4vw, 56px)", gap: "clamp(24px, 2.5vw, 36px)" }}>
              {pricingTiers.map((tier) => (
                <article
                  key={tier.name}
                  className={[
                    "flex min-h-[340px] flex-col rounded-[32px] border transition-[background-color,border-color,color,box-shadow,transform] duration-300",
                    isDark
                      ? "border-[#1F6F5F]/14 bg-transparent hover:border-[#1F6F5F]/28 hover:bg-[rgba(31,111,95,0.10)]"
                      : "border-[#124170]/8 bg-transparent hover:border-[#1F6F5F]/18 hover:bg-[rgba(234,242,239,0.66)]",
                  ].join(" ")}
                  style={{
                    padding: "clamp(28px, 3vw, 36px)",
                    boxShadow: isDark ? "0 16px 48px rgba(3, 12, 20, 0.08)" : "0 16px 48px rgba(18, 65, 112, 0.04)",
                    background: isDark ? "rgba(14,32,42,0.28)" : "rgba(234,242,239,0.42)",
                  }}
                >
                  <div style={{ display: "grid", gap: "18px" }}>
                    <p className={["text-sm font-medium tracking-[0.08em]", isDark ? "text-[#F8F9FA]/62" : "text-[#124170]/68"].join(" ")}>
                      {tier.name}
                    </p>
                    <h3 className={`${headingClass} text-2xl font-semibold`}>{tier.summary}</h3>
                    <p
                      className={["text-base", isDark ? "text-[#F8F9FA]/72" : "text-[#2C3E50]/74"].join(" ")}
                      style={{ lineHeight: 1.85 }}
                    >
                      {tier.detail}
                    </p>
                  </div>
                  <ul className="space-y-[16px] text-sm leading-6 sm:text-base" style={{ marginTop: "24px" }}>
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#1F6F5F]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto" style={{ paddingTop: "32px" }}>
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

        <div style={{ marginTop: "clamp(96px, 10vw, 140px)" }}>
          <MarketingFooter contained theme={theme} />
        </div>
      </div>
    </main>
  );
}
