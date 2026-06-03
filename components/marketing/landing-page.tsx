"use client";

import { type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { routes } from "@/config/routes";
import { useTheme } from "@/providers/theme-provider";
import { MarketingFooter } from "./marketing-footer";
import { MarketingNav } from "./marketing-nav";

type FeatureCard = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
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

const headingClass = "font-[family:var(--font-heading)]";
const heroToFeaturesSpacing = "clamp(40px, 5.2vw, 64px)";
const featureToStorySpacing = "clamp(44px, 5.8vw, 72px)";
const majorSectionSpacing = "clamp(40px, 5.4vw, 68px)";
const pricingToBannerSpacing = "clamp(42px, 5.5vw, 70px)";
const bannerToFooterSpacing = "clamp(48px, 5.8vw, 74px)";

const featureCards: FeatureCard[] = [
  {
    id: "platform",
    eyebrow: "AI website generation",
    title: "AI Website Generation",
    description: "Turn a single prompt into a public-ready website with balanced layout, brand-led storytelling, and launch-ready page structure.",
    ctaLabel: "Explore platform",
    href: "#platform-story",
  },
  {
    id: "workflow",
    eyebrow: "Publishing workflow",
    title: "Automated Publishing Workflow",
    description: "Guide teams from brief to review to release with a calmer operating surface that keeps automation visible without feeling like a dashboard.",
    ctaLabel: "View insights",
    href: "#insights",
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

function buildCardStyle(padding: string, background: string, shadow: string): CSSProperties {
  return {
    padding,
    boxShadow: shadow,
    ["--marketing-card-bg" as string]: background,
    ["--marketing-card-shadow" as string]: shadow,
  } as CSSProperties;
}

function buildPanelStyle(padding: string, background: string, shadow: string, border: string, hoverBorder: string): CSSProperties {
  return {
    padding,
    ["--marketing-surface-bg" as string]: background,
    ["--marketing-surface-border" as string]: border,
    ["--marketing-surface-shadow" as string]: shadow,
    ["--marketing-surface-hover-border" as string]: hoverBorder,
    ["--marketing-surface-hover-shadow" as string]: shadow,
  } as CSSProperties;
}

export function LandingPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const heroAccentLogo = isDark ? "/images/AI robot logo dark.svg" : "/images/AI robot logo light.svg";
  const heroPrimaryGlow = isDark ? "rgba(31,111,95,0.18)" : "rgba(31,111,95,0.18)";
  const heroChalkGlow = isDark ? "rgba(234,242,239,0.10)" : "rgba(234,242,239,0.10)";
  const heroMintGlow = isDark ? "rgba(173,230,205,0.10)" : "rgba(173,230,205,0.10)";
  const heroPanelBackground = isDark ? "rgba(11,36,29,0.74)" : "rgba(248,249,250,0.74)";
  const heroPanelGradient = isDark
    ? "linear-gradient(116deg, rgba(6,26,20,0.95) 0%, rgba(10,32,26,0.92) 38%, rgba(15,48,40,0.88) 70%, rgba(22,67,58,0.82) 100%)"
    : "linear-gradient(118deg, rgba(248,249,250,0.96) 0%, rgba(234,242,239,0.88) 42%, rgba(173,230,205,0.18) 100%)";
  const heroPanelAtmosphere = isDark
    ? "radial-gradient(circle at left center, rgba(31,111,95,0.18), transparent 36%), radial-gradient(circle at 78% 22%, rgba(173,230,205,0.10), transparent 24%), radial-gradient(88% 112% at 94% 56%, rgba(60,145,121,0.18) 0%, rgba(24,79,65,0.12) 44%, rgba(8,28,23,0.03) 72%, transparent 100%)"
    : "radial-gradient(circle at left center, rgba(31,111,95,0.16), transparent 36%), radial-gradient(circle at 78% 18%, rgba(173,230,205,0.14), transparent 24%)";
  const heroPanelHighlight = isDark
    ? "radial-gradient(44% 58% at 82% 56%, rgba(194,239,220,0.10) 0%, rgba(77,156,133,0.08) 38%, transparent 72%), radial-gradient(circle at 88% 16%, rgba(84,157,136,0.08), transparent 22%)"
    : "radial-gradient(circle at 86% 16%, rgba(18,65,112,0.06), transparent 24%)";
  const heroRobotHalo = isDark
    ? "radial-gradient(ellipse at center, rgba(194,239,220,0.14) 0%, rgba(72,150,127,0.11) 38%, rgba(11,36,29,0.04) 68%, transparent 82%)"
    : null;

  return (
    <main
      id="main-content"
      className="min-h-screen text-[var(--marketing-text)] transition-colors duration-300"
      style={{ backgroundColor: isDark ? "#061A14" : "#F8F9FA" }}
    >
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: isDark
            ? `radial-gradient(circle at top, ${heroPrimaryGlow}, transparent 32%), radial-gradient(circle at 18% 22%, ${heroMintGlow}, transparent 34%), radial-gradient(circle at 84% 12%, rgba(18,65,112,0.10), transparent 26%), linear-gradient(180deg, #061A14 0%, #0B241D 56%, #061A14 100%)`
            : `radial-gradient(circle at top, ${heroPrimaryGlow}, transparent 34%), radial-gradient(circle at 20% 18%, ${heroChalkGlow}, transparent 36%), radial-gradient(circle at 82% 10%, ${heroMintGlow}, transparent 32%), linear-gradient(180deg, #F8F9FA 0%, #F2F6F3 48%, #F8F9FA 100%)`,
        }}
      />

      <div
        className="relative pt-[24px] pb-[56px] md:pt-[32px] md:pb-[64px] lg:pb-[72px]"
        style={{ paddingTop: "clamp(32px, 5vw, 56px)", paddingBottom: "clamp(56px, 7vw, 88px)" }}
      >
        <div className="marketing-shell">
          <MarketingNav currentPath="/" contained />
        </div>

        <div className="marketing-shell" style={{ marginTop: "clamp(48px, 6vw, 80px)" }}>
          <section
            id="product"
            className="marketing-hero-section relative overflow-hidden rounded-[44px] border border-transparent transition-colors duration-300 xl:rounded-[52px]"
            style={{
              borderColor: isDark ? "rgba(173,230,205,0.18)" : "rgba(31,111,95,0.16)",
              background: heroPanelBackground,
              boxShadow: isDark ? "0 32px 120px rgba(0, 0, 0, 0.28)" : "0 32px 120px rgba(18, 65, 112, 0.10)",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: heroPanelGradient,
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: heroPanelAtmosphere,
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: heroPanelHighlight,
              }}
            />

            <div className="marketing-hero-layout relative z-10">
              <div className="marketing-hero-copy">
                <div style={{ display: "grid", gap: "clamp(14px, 1.8vw, 20px)" }}>
                  <div className="flex flex-wrap items-center gap-3 text-sm font-semibold tracking-[0.08em] text-current">
                    <Image src={heroAccentLogo} alt="" width={32} height={32} className="h-8 w-8" priority />
                    <span>Zero Labs AI Publisher</span>
                  </div>

                  <p className="marketing-label-muted max-w-md text-sm font-semibold tracking-[0.08em]">
                    Sustainable humanistic AI / futuristic nature interface
                  </p>
                  <h1
                    className={`${headingClass} marketing-hero-title max-w-[12ch] font-semibold tracking-[-0.045em]`}
                    style={{ lineHeight: 0.9 }}
                  >
                    <span className="block">Turn prompts into</span>
                    <span className="block">published AI</span>
                    <span className="block">websites</span>
                  </h1>
                  <p className="marketing-copy-muted max-w-[28rem] text-[clamp(0.98rem,0.9rem+0.28vw,1.08rem)]" style={{ lineHeight: 1.72 }}>
                    Zero Labs AI Publisher transforms a prompt into a polished website and guides the publishing workflow all the way to release.
                  </p>
                </div>

                <div className="flex flex-wrap items-stretch gap-[clamp(0.62rem,0.9vw,0.82rem)]" style={{ marginTop: "clamp(18px, 2vw, 30px)" }}>
                  <Link
                    href={routes.signup}
                    className="marketing-primary-button inline-flex min-h-14 flex-1 items-center justify-center rounded-full px-[clamp(1rem,1.8vw,1.5rem)] text-sm font-semibold sm:flex-none"
                  >
                    Start building
                  </Link>
                  <Link
                    href="#platform"
                    className="marketing-secondary-button inline-flex min-h-14 flex-1 items-center justify-center rounded-full px-[clamp(0.95rem,1.7vw,1.4rem)] text-sm font-semibold sm:flex-none"
                  >
                    Learn more
                  </Link>
                </div>
              </div>

              <div className="marketing-hero-visual">
                <div className="marketing-hero-visual-shell relative isolate">
                  {heroRobotHalo ? (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute"
                      style={{
                        top: "12%",
                        right: "8%",
                        bottom: "8%",
                        left: "8%",
                        borderRadius: "999px",
                        background: heroRobotHalo,
                        filter: "blur(40px)",
                      }}
                    />
                  ) : null}
                  <Image
                    src="/images/FULL ROBOT BODY.svg"
                    alt=""
                    width={820}
                    height={1080}
                    priority
                    className="marketing-hero-robot pointer-events-none relative z-10 h-auto w-full object-contain"
                    style={{
                      opacity: isDark ? 0.56 : 0.4,
                      filter: "drop-shadow(0 0 56px rgba(31,111,95,0.18)) saturate(1.08) brightness(1.02)",
                    }}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="marketing-shell" style={{ marginTop: heroToFeaturesSpacing }}>
          <section
            id="platform"
            className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))]"
            style={{ gap: "clamp(28px, 3vw, 40px)" }}
          >
            {featureCards.map((card) => (
              <article
                key={card.title}
                className="marketing-glow-card group relative flex min-h-[clamp(16rem,24vw,19rem)] h-full flex-col overflow-hidden rounded-[36px]"
                style={buildCardStyle(
                  "clamp(24px, 3vw, 38px)",
                  isDark ? "rgba(11,36,29,0.18)" : "rgba(248,249,250,0.20)",
                  isDark ? "0 18px 60px rgba(0, 0, 0, 0.12)" : "0 18px 60px rgba(18, 65, 112, 0.04)"
                )}
              >
                <div
                  className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: isDark
                      ? "radial-gradient(circle at top right, rgba(31,111,95,0.20), transparent 38%)"
                      : "radial-gradient(circle at top right, rgba(173,230,205,0.22), transparent 40%)",
                  }}
                />
                <div className="relative flex h-full flex-col justify-between" style={{ gap: "clamp(20px, 2.3vw, 30px)" }}>
                  <div className="flex-1" style={{ display: "grid", gap: "16px" }}>
                    <span
                      aria-hidden="true"
                      className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border"
                      style={{
                        borderColor: isDark ? "rgba(173,230,205,0.2)" : "rgba(31,111,95,0.2)",
                        background: isDark ? "rgba(11,36,29,0.3)" : "rgba(248,249,250,0.36)",
                        color: isDark ? "#EAF2EF" : "#124170",
                        boxShadow: isDark ? "0 12px 30px rgba(0,0,0,0.14)" : "0 12px 30px rgba(18,65,112,0.08)",
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {card.id === "platform" ? (
                          <>
                            <path d="M6.5 8.5h11" />
                            <path d="M6.5 12h11" />
                            <path d="M6.5 15.5h6.5" />
                            <path d="M5 5.75h14a1.25 1.25 0 0 1 1.25 1.25v10a1.25 1.25 0 0 1-1.25 1.25H5A1.25 1.25 0 0 1 3.75 17V7A1.25 1.25 0 0 1 5 5.75Z" />
                          </>
                        ) : (
                          <>
                            <path d="M7 6.75h6" />
                            <path d="M7 12h10" />
                            <path d="M7 17.25h4.5" />
                            <path d="M16.75 6.75h.5" />
                            <path d="M16.75 17.25h.5" />
                          </>
                        )}
                      </svg>
                    </span>
                    <p className="marketing-label-muted text-sm font-semibold tracking-[0.08em]">{card.eyebrow}</p>
                    <h2 className={`${headingClass} marketing-section-card-title max-w-[15ch] font-semibold leading-tight`}>{card.title}</h2>
                    <p className="marketing-copy-muted max-w-xl text-base" style={{ lineHeight: 1.76 }}>
                      {card.description}
                    </p>
                  </div>
                  <Link href={card.href} className="marketing-secondary-button inline-flex min-h-12 w-full items-center justify-center rounded-full px-7 text-sm font-semibold sm:w-fit">
                    {card.ctaLabel}
                  </Link>
                </div>
              </article>
            ))}
          </section>
        </div>

        <div style={{ marginTop: featureToStorySpacing, display: "grid", gap: majorSectionSpacing }}>
          {storySections.map((section) => (
            <div key={section.id} className="marketing-shell">
              <section
                id={section.id}
                className="marketing-panel-surface relative overflow-hidden rounded-[40px] backdrop-blur-xl"
                style={buildPanelStyle(
                  "clamp(28px, 4vw, 46px)",
                  isDark ? "rgba(11,36,29,0.72)" : "rgba(248,249,250,0.74)",
                  isDark ? "0 20px 80px rgba(0, 0, 0, 0.16)" : "0 20px 80px rgba(18, 65, 112, 0.05)",
                  isDark ? "rgba(173,230,205,0.16)" : "rgba(31,111,95,0.14)",
                  isDark ? "rgba(173,230,205,0.22)" : "rgba(31,111,95,0.18)"
                )}
              >
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: isDark
                      ? "radial-gradient(circle at top right, rgba(31,111,95,0.16), transparent 34%), radial-gradient(circle at 14% 20%, rgba(173,230,205,0.08), transparent 24%)"
                      : "radial-gradient(circle at top right, rgba(31,111,95,0.12), transparent 34%), radial-gradient(circle at 14% 20%, rgba(173,230,205,0.12), transparent 24%)",
                  }}
                />
                <div className="relative max-w-[760px]" style={{ display: "grid", gap: "22px" }}>
                  <p className="marketing-label-muted text-sm font-semibold tracking-[0.08em]">{section.eyebrow}</p>
                  <h2 className={`${headingClass} marketing-section-title font-semibold leading-tight`}>{section.title}</h2>
                  <p className="marketing-copy-muted max-w-3xl text-base sm:text-lg" style={{ lineHeight: 1.85 }}>
                    {section.description}
                  </p>
                </div>

                <div
                  className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))]"
                  style={{ marginTop: "clamp(36px, 3.6vw, 48px)", gap: "clamp(22px, 2.3vw, 32px)" }}
                >
                  {section.cards.map((card) => (
                    <article
                      key={card.title}
                      className="marketing-glow-card flex min-h-[clamp(12.5rem,18vw,14.5rem)] h-full flex-col rounded-[32px]"
                      style={buildCardStyle(
                        "clamp(22px, 2.6vw, 30px)",
                        isDark ? "rgba(11,36,29,0.14)" : "rgba(248,249,250,0.16)",
                        isDark ? "0 16px 48px rgba(0, 0, 0, 0.08)" : "0 16px 48px rgba(18, 65, 112, 0.04)"
                      )}
                    >
                      <div className="flex h-full flex-col justify-between" style={{ gap: "14px" }}>
                        <h3 className={`${headingClass} marketing-section-card-title font-semibold`}>{card.title}</h3>
                        <p className="marketing-copy-muted text-base" style={{ lineHeight: 1.76 }}>
                          {card.description}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          ))}

          <div className="marketing-shell">
            <section
              id="pricing"
              className="marketing-panel-surface relative overflow-hidden rounded-[40px] backdrop-blur-xl"
              style={buildPanelStyle(
                "clamp(28px, 4vw, 46px)",
                isDark ? "rgba(11,36,29,0.72)" : "rgba(248,249,250,0.74)",
                isDark ? "0 20px 80px rgba(0, 0, 0, 0.16)" : "0 20px 80px rgba(18, 65, 112, 0.05)",
                isDark ? "rgba(173,230,205,0.16)" : "rgba(31,111,95,0.14)",
                isDark ? "rgba(173,230,205,0.22)" : "rgba(31,111,95,0.18)"
              )}
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: isDark
                    ? "radial-gradient(circle at top right, rgba(31,111,95,0.14), transparent 32%), radial-gradient(circle at 16% 14%, rgba(173,230,205,0.08), transparent 26%)"
                    : "radial-gradient(circle at top right, rgba(31,111,95,0.10), transparent 32%), radial-gradient(circle at 16% 14%, rgba(173,230,205,0.12), transparent 26%)",
                }}
              />
              <div className="relative max-w-[760px]" style={{ display: "grid", gap: "22px" }}>
                <p className="marketing-label-muted text-sm font-semibold tracking-[0.08em]">Pricing</p>
                  <h2 className={`${headingClass} marketing-section-title font-semibold leading-tight`}>
                    Three pricing paths for teams growing into AI-powered publishing operations.
                  </h2>
                <p className="marketing-copy-muted max-w-3xl text-base sm:text-lg" style={{ lineHeight: 1.85 }}>
                  Each tier keeps the homepage public-facing and calm while expanding how much of the publishing workflow Zero Labs AI Publisher can orchestrate.
                </p>
              </div>

              <div
                className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,16.5rem),1fr))]"
                style={{ marginTop: "clamp(36px, 3.6vw, 48px)", gap: "clamp(22px, 2.3vw, 32px)" }}
              >
                {pricingTiers.map((tier) => (
                  <article
                    key={tier.name}
                    className="marketing-glow-card flex min-h-[clamp(16rem,22vw,18.5rem)] h-full flex-col rounded-[32px]"
                    style={buildCardStyle(
                      "clamp(22px, 2.6vw, 30px)",
                      isDark ? "rgba(11,36,29,0.14)" : "rgba(248,249,250,0.16)",
                      isDark ? "0 16px 48px rgba(0, 0, 0, 0.08)" : "0 16px 48px rgba(18, 65, 112, 0.04)"
                    )}
                  >
                    <div className="flex-1" style={{ display: "grid", gap: "14px" }}>
                      <p className="marketing-label-muted text-sm font-semibold tracking-[0.08em]">{tier.name}</p>
                      <h3 className={`${headingClass} marketing-section-card-title font-semibold`}>{tier.summary}</h3>
                      <p className="marketing-copy-muted text-base" style={{ lineHeight: 1.76 }}>
                        {tier.detail}
                      </p>
                    </div>
                    <ul className="mt-4 space-y-[13px] text-sm leading-6 sm:text-base">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#1F6F5F]" />
                          <span className="marketing-copy-muted">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-7">
                      <Link href={routes.signup} className="marketing-primary-button inline-flex min-h-12 w-full items-center justify-center rounded-full px-7 text-sm font-semibold sm:w-fit">
                        Choose {tier.name}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="marketing-shell" style={{ marginTop: pricingToBannerSpacing }}>
          <section
            aria-labelledby="banner-showcase-title"
            className="marketing-panel-surface relative overflow-hidden rounded-[40px] backdrop-blur-xl"
            style={buildPanelStyle(
                "clamp(20px, 3vw, 32px)",
              isDark ? "rgba(11,36,29,0.68)" : "rgba(248,249,250,0.74)",
              isDark ? "0 0 42px rgba(31,111,95,0.18), 0 24px 90px rgba(0,0,0,0.16)" : "0 0 34px rgba(31,111,95,0.12), 0 24px 90px rgba(18,65,112,0.08)",
              isDark ? "rgba(173,230,205,0.22)" : "rgba(31,111,95,0.18)",
              isDark ? "rgba(173,230,205,0.3)" : "rgba(31,111,95,0.26)"
            )}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: isDark
                  ? "radial-gradient(circle at top right, rgba(31,111,95,0.16), transparent 32%), radial-gradient(circle at 12% 18%, rgba(173,230,205,0.08), transparent 24%)"
                  : "radial-gradient(circle at top right, rgba(31,111,95,0.12), transparent 32%), radial-gradient(circle at 12% 18%, rgba(173,230,205,0.12), transparent 24%)",
              }}
            />
            <div className="relative grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] items-center gap-8 lg:gap-12">
              <div className="max-w-xl space-y-5">
                <p className="marketing-label-muted text-sm font-semibold tracking-[0.08em]">Visual showcase</p>
                <h2 id="banner-showcase-title" className={`${headingClass} marketing-section-title font-semibold leading-tight`}>
                  A calmer public surface for AI-powered publishing.
                </h2>
                <p className="marketing-copy-muted text-base sm:text-lg" style={{ lineHeight: 1.85 }}>
                  Give the launch story room to breathe with a dedicated visual moment that supports the narrative without crowding the feature cards.
                </p>
              </div>

              <div
                className="relative rounded-[32px] border p-[clamp(1rem,2.4vw,2rem)]"
                style={{
                  borderColor: isDark ? "rgba(173,230,205,0.18)" : "rgba(31,111,95,0.16)",
                  background: isDark ? "rgba(6,26,20,0.36)" : "rgba(248,249,250,0.6)",
                  boxShadow: isDark ? "0 18px 54px rgba(0,0,0,0.16)" : "0 18px 54px rgba(18,65,112,0.06)",
                }}
              >
                <Image
                  src={isDark ? "/images/Banner.svg" : "/images/Banner Light.svg"}
                  alt="Zero Labs AI Publisher banner"
                  width={1280}
                  height={720}
                  className="h-auto max-h-[420px] w-full object-contain"
                  priority
                />
              </div>
            </div>
          </section>
        </div>

        <div className="marketing-shell" style={{ marginTop: bannerToFooterSpacing }}>
          <MarketingFooter contained />
        </div>
      </div>
    </main>
  );
}
