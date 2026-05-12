"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { routes } from "@/config/routes";
import { MarketingFooter } from "./marketing-footer";
import { MarketingNav } from "./marketing-nav";

type ContentCard = {
  title: string;
  description: string;
  eyebrow?: string;
};

type MetricCard = {
  label: string;
  value: string;
  detail: string;
};

type PricingTier = {
  name: string;
  positioning: string;
  summary: string;
  features: string[];
};

const aboutCards: ContentCard[] = [
  {
    eyebrow: "What it is",
    title: "AI publishing operating layer",
    description:
      "Zero Labs AI Publisher converts one structured prompt into coordinated websites, articles, and social assets with a consistent execution surface.",
  },
  {
    eyebrow: "What it solves",
    title: "Fragmented publishing workflows",
    description:
      "Replace disconnected CMS edits, copy decks, and handoffs with one system that keeps generation, review, and distribution aligned.",
  },
  {
    eyebrow: "Why it matters",
    title: "Velocity with governance",
    description:
      "Scale output while preserving approval checkpoints, brand quality, and operational visibility across every publishing channel.",
  },
];

const workflowSteps: ContentCard[] = [
  {
    eyebrow: "Prompt",
    title: "Define the brief",
    description: "Set intent once and initiate a structured content operation.",
  },
  {
    eyebrow: "Generate",
    title: "Produce drafts",
    description: "Create websites, article narratives, and social variants together.",
  },
  {
    eyebrow: "Review",
    title: "Apply oversight",
    description: "Keep humans in control of quality and final editorial decisions.",
  },
  {
    eyebrow: "Publish",
    title: "Ship to channels",
    description: "Move approved output to web, blog, and campaign touchpoints.",
  },
  {
    eyebrow: "Track",
    title: "Measure operations",
    description: "Monitor performance signals to improve automation leverage.",
  },
];

const insightMetrics: MetricCard[] = [
  { label: "Web properties generated", value: "128", detail: "Illustrative portfolio volume from coordinated prompt-led production." },
  { label: "Content units produced", value: "3.4K", detail: "Pages, articles, and campaign assets managed inside one system." },
  { label: "Workflow automation", value: "82%", detail: "Share of production cycle AI can accelerate before final approval." },
  { label: "Ops time recovered", value: "41 hrs/wk", detail: "Demonstration efficiency gain for lean publishing teams." },
  { label: "Distribution channels", value: "12", detail: "Website, blog, and social destinations connected to one workflow." },
  { label: "Review checkpoints", value: "5", detail: "Structured controls from intake through measurable release." },
];

const pricingTiers: PricingTier[] = [
  {
    name: "Starter",
    positioning: "For focused teams launching core surfaces",
    summary: "Prompt-to-page workflow for early publishing operations.",
    features: ["Website and blog generation", "Lightweight approvals", "Core analytics dashboard"],
  },
  {
    name: "Growth",
    positioning: "For scaling content organizations",
    summary: "Expanded automation and review depth for multi-channel output.",
    features: ["Multi-surface orchestration", "Role-based review handoffs", "Performance and cadence insights"],
  },
  {
    name: "Platform",
    positioning: "For enterprise-grade publishing infrastructure",
    summary: "Unified AI operations layer for high-volume programs.",
    features: ["Cross-team governance", "Advanced workflow controls", "Strategic analytics and reporting"],
  },
];

const heroValueCards: ContentCard[] = [
  { title: "Platform posture", description: "AI-native publishing infrastructure", eyebrow: "Core" },
  { title: "Operational focus", description: "Structured review and release", eyebrow: "Control" },
  { title: "Business signal", description: "Faster output with measurable quality", eyebrow: "Value" },
];

const searchCards: ContentCard[] = [
  ...aboutCards,
  ...workflowSteps,
  ...pricingTiers.map((tier) => ({
    eyebrow: tier.name,
    title: `${tier.name} business model`,
    description: `${tier.positioning}. ${tier.summary}`,
  })),
  ...insightMetrics.map((metric) => ({
    eyebrow: metric.label,
    title: `${metric.value} ${metric.label}`,
    description: metric.detail,
  })),
];

function textIncludesQuery(text: string, query: string) {
  return text.toLowerCase().includes(query);
}

export function LandingPage() {
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const isFiltered = normalizedQuery.length > 0;
  const sectionShellClass = "mx-auto w-full max-w-7xl px-6 lg:px-8 xl:px-0";

  const filteredAboutCards = useMemo(
    () =>
      normalizedQuery
        ? aboutCards.filter((card) => textIncludesQuery(`${card.eyebrow} ${card.title} ${card.description}`, normalizedQuery))
        : aboutCards,
    [normalizedQuery]
  );

  const filteredWorkflowSteps = useMemo(
    () =>
      normalizedQuery
        ? workflowSteps.filter((step) => textIncludesQuery(`${step.eyebrow} ${step.title} ${step.description}`, normalizedQuery))
        : workflowSteps,
    [normalizedQuery]
  );

  const filteredInsightMetrics = useMemo(
    () =>
      normalizedQuery
        ? insightMetrics.filter((metric) => textIncludesQuery(`${metric.label} ${metric.value} ${metric.detail}`, normalizedQuery))
        : insightMetrics,
    [normalizedQuery]
  );

  const filteredPricingTiers = useMemo(
    () =>
      normalizedQuery
        ? pricingTiers.filter((tier) =>
            textIncludesQuery(`${tier.name} ${tier.positioning} ${tier.summary} ${tier.features.join(" ")}`, normalizedQuery)
          )
        : pricingTiers,
    [normalizedQuery]
  );

  const searchResults = useMemo(
    () =>
      normalizedQuery
        ? searchCards.filter((card) => textIncludesQuery(`${card.eyebrow} ${card.title} ${card.description}`, normalizedQuery))
        : searchCards.slice(0, 6),
    [normalizedQuery]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <MarketingNav currentPath="/" />

      <main className="overflow-x-hidden">
        <section className="relative border-b border-emerald-400/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(13,148,136,0.18),_transparent_40%)]" />
          <div
            className={`${sectionShellClass} relative grid items-center gap-12 py-20 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-16 lg:py-28`}
          >
            <div className="space-y-9">
              <div className="inline-flex items-center rounded-full border border-emerald-300/40 bg-emerald-400/10 px-4 py-2 text-xs font-semibold tracking-[0.16em] text-emerald-100 uppercase">
                Investor-ready AI infrastructure surface
              </div>
              <div className="space-y-6">
                <h1 className="max-w-2xl text-4xl font-semibold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-6xl">
                  AI publishing infrastructure for high-velocity digital operations.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg lg:text-xl">
                  Zero Labs AI Publisher structures prompt-to-publish execution for teams that need modern automation, clear review
                  controls, and measurable output across websites, blog content, and social channels.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  href={routes.login}
                  className="inline-flex items-center justify-center rounded-full border border-emerald-300/60 bg-emerald-500/70 px-7 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  Start building
                </Link>
                <Link
                  href="#workflow"
                  className="inline-flex items-center justify-center rounded-full border border-emerald-300/25 bg-slate-900/80 px-7 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15"
                >
                  Explore workflow
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {heroValueCards.map((card) => (
                  <article key={card.title} className="h-full rounded-2xl border border-emerald-400/20 bg-slate-900/75 p-5">
                    <p className="text-xs font-semibold tracking-[0.16em] text-emerald-200 uppercase">{card.eyebrow}</p>
                    <h2 className="mt-3 text-base font-semibold text-white">{card.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{card.description}</p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="rounded-3xl border border-emerald-400/20 bg-gradient-to-b from-emerald-500/10 via-slate-900 to-slate-900 p-6 shadow-2xl shadow-emerald-950/40 lg:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-emerald-200 uppercase">Command center</p>
                  <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Publishing operations panel</h2>
                </div>
                <span className="inline-flex w-fit rounded-full border border-emerald-300/50 bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-100">
                  Workflow active
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  "Prompt intake aligns web, blog, and social outputs.",
                  "Review gates preserve quality and compliance.",
                  "Analytics surfaces show automation leverage and efficiency.",
                ].map((line) => (
                  <div key={line} className="rounded-2xl border border-emerald-300/15 bg-slate-950/80 p-4 text-sm text-slate-300">
                    {line}
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {insightMetrics.slice(0, 4).map((metric) => (
                  <article key={metric.label} className="rounded-2xl border border-emerald-300/20 bg-slate-900/90 p-5">
                    <p className="text-xs tracking-[0.15em] text-slate-400 uppercase">{metric.label}</p>
                    <p className="mt-3 text-2xl font-semibold text-emerald-100">{metric.value}</p>
                    <p className="mt-2 text-sm text-slate-400">{metric.detail}</p>
                  </article>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section id="search" className={`${sectionShellClass} py-20 lg:py-28`}>
          <div className="rounded-3xl border border-emerald-400/20 bg-slate-900/80 p-8 lg:p-10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <p className="text-sm font-semibold tracking-[0.2em] text-emerald-200 uppercase">Search the platform surface</p>
                <h2 className="text-3xl font-semibold text-white sm:text-4xl">Find product themes, workflow stages, and business signals.</h2>
                <p className="text-base leading-7 text-slate-300">
                  Search helps focus the landing surface without crowding the core investor narrative.
                </p>
              </div>
              <div className="w-full max-w-xl">
                <label className="sr-only" htmlFor="landing-search">
                  Search the landing page
                </label>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <input
                    id="landing-search"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search workflows, analytics, business model, or channels"
                    className="min-h-12 rounded-xl border border-emerald-300/30 bg-slate-950 px-4 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="rounded-xl border border-emerald-300/30 px-5 py-3 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/15"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {searchResults.length > 0 ? (
                searchResults.map((card) => (
                  <article key={card.title} className="h-full rounded-2xl border border-emerald-300/20 bg-slate-950/80 p-6">
                    <p className="text-xs font-semibold tracking-[0.15em] text-emerald-200 uppercase">{card.eyebrow}</p>
                    <h3 className="mt-3 text-xl font-semibold text-white">{card.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{card.description}</p>
                  </article>
                ))
              ) : (
                <article className="rounded-2xl border border-dashed border-emerald-300/30 bg-slate-950/80 p-6 text-sm text-slate-300 lg:col-span-3">
                  No sections match this query yet. Try workflow, analytics, growth, starter, or publish.
                </article>
              )}
            </div>
          </div>
        </section>

        <section id="about" className={`${sectionShellClass} py-20 lg:py-28`}>
          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-semibold tracking-[0.2em] text-emerald-200 uppercase">About</p>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">A premium AI publishing system built for operational scale.</h2>
            <p className="text-base leading-8 text-slate-300 sm:text-lg">
              The platform is designed for teams that need balanced speed, governance, and measurable performance from AI-driven publishing.
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {filteredAboutCards.length > 0 ? (
              filteredAboutCards.map((card) => (
                <article key={card.title} className="h-full rounded-3xl border border-emerald-300/20 bg-slate-900/75 p-7">
                  <p className="text-xs font-semibold tracking-[0.18em] text-emerald-200 uppercase">{card.eyebrow}</p>
                  <h3 className="mt-4 text-2xl font-semibold text-white">{card.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-300">{card.description}</p>
                </article>
              ))
            ) : (
              <article className="rounded-2xl border border-dashed border-emerald-300/30 bg-slate-900/70 p-6 text-sm text-slate-300 lg:col-span-3">
                Search filtering currently hides this section. Clear search to view full About content.
              </article>
            )}
          </div>
        </section>

        <section id="workflow" className={`${sectionShellClass} py-20 lg:py-28`}>
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/[0.08] p-8 lg:p-10">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm font-semibold tracking-[0.2em] text-emerald-200 uppercase">Workflow</p>
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">Prompt → Generate → Review → Publish → Track</h2>
              <p className="text-base leading-8 text-slate-300 sm:text-lg">
                A structured operating loop that keeps AI execution practical, reviewable, and deployment-ready.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
              {filteredWorkflowSteps.length > 0 ? (
                filteredWorkflowSteps.map((step, index) => (
                  <article key={step.title} className="relative h-full rounded-2xl border border-emerald-300/20 bg-slate-950/85 p-6">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/15 text-xs font-semibold text-emerald-100">
                      {index + 1}
                    </span>
                    <p className="mt-4 text-xs font-semibold tracking-[0.16em] text-emerald-200 uppercase">{step.eyebrow}</p>
                    <h3 className="mt-3 text-xl font-semibold text-white">{step.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{step.description}</p>
                    {index < filteredWorkflowSteps.length - 1 ? (
                      <span className="absolute top-9 -right-3 hidden text-lg text-emerald-300 xl:block">→</span>
                    ) : null}
                  </article>
                ))
              ) : (
                <article className="rounded-2xl border border-dashed border-emerald-300/30 bg-slate-950/80 p-6 text-sm text-slate-300 xl:col-span-5">
                  No workflow step matches the current query. Clear search to restore all five stages.
                </article>
              )}
            </div>
          </div>
        </section>

        <section id="insights" className={`${sectionShellClass} py-20 lg:py-28`}>
          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-semibold tracking-[0.2em] text-emerald-200 uppercase">Insights and analytics</p>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">Dedicated metrics surface for operators and investor demos.</h2>
            <p className="text-base leading-8 text-slate-300 sm:text-lg">
              Illustrative values that demonstrate platform leverage without presenting production telemetry.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredInsightMetrics.length > 0 ? (
              filteredInsightMetrics.map((metric) => (
                <article key={metric.label} className="flex h-full flex-col rounded-3xl border border-emerald-300/20 bg-slate-900/80 p-7">
                  <p className="text-xs font-semibold tracking-[0.17em] text-slate-400 uppercase">{metric.label}</p>
                  <p className="mt-5 text-3xl font-semibold text-emerald-100">{metric.value}</p>
                  <p className="mt-4 text-sm leading-7 text-slate-300">{metric.detail}</p>
                </article>
              ))
            ) : (
              <article className="rounded-2xl border border-dashed border-emerald-300/30 bg-slate-900/70 p-6 text-sm text-slate-300 xl:col-span-3">
                Search filtering currently hides analytics cards. Clear search to view the full metrics grid.
              </article>
            )}
          </div>
        </section>

        <section className={`${sectionShellClass} py-20 lg:py-28`}>
          <div className="rounded-3xl border border-emerald-400/20 bg-slate-900/80 p-8 lg:p-10">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm font-semibold tracking-[0.2em] text-emerald-200 uppercase">Business model</p>
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">Flexible platform tiers for evolving AI publishing operations.</h2>
              <p className="text-base leading-8 text-slate-300 sm:text-lg">
                Positioning tiers are illustrative and designed for investor discussions around market fit and expansion paths.
              </p>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {filteredPricingTiers.length > 0 ? (
                filteredPricingTiers.map((tier) => (
                  <article key={tier.name} className="h-full rounded-2xl border border-emerald-300/25 bg-slate-950/85 p-6">
                    <p className="text-xs font-semibold tracking-[0.16em] text-emerald-200 uppercase">{tier.name}</p>
                    <h3 className="mt-3 text-2xl font-semibold text-white">{tier.positioning}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{tier.summary}</p>
                    <ul className="mt-5 space-y-2 text-sm text-slate-300">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))
              ) : (
                <article className="rounded-2xl border border-dashed border-emerald-300/30 bg-slate-950/80 p-6 text-sm text-slate-300 lg:col-span-3">
                  Search filtering currently hides pricing tiers. Clear search to restore Starter, Growth, and Platform cards.
                </article>
              )}
            </div>
          </div>
        </section>

        <section className={`${sectionShellClass} pb-20 lg:pb-28`}>
          <div className="rounded-3xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/15 via-slate-900 to-slate-900 p-8 text-center lg:p-12">
            <p className="text-sm font-semibold tracking-[0.2em] text-emerald-200 uppercase">Next step</p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Launch a premium AI publishing workflow with control and speed.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Move from fragmented content tooling to a unified automation platform built for scalable, investor-grade execution.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href={routes.login}
                className="inline-flex items-center justify-center rounded-full border border-emerald-200/60 bg-emerald-500 px-7 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400"
              >
                Enter workspace
              </Link>
              <Link
                href="/blog"
                className="inline-flex items-center justify-center rounded-full border border-emerald-200/35 bg-slate-900/70 px-7 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15"
              >
                Read platform updates
              </Link>
            </div>
            {isFiltered ? (
              <p className="mt-6 text-sm text-slate-400">
                Search is filtering homepage sections. Clear query to view the full investor-ready narrative.
              </p>
            ) : null}
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
