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

const productCards: ContentCard[] = [
  {
    eyebrow: "What it is",
    title: "An AI publishing operating layer",
    description:
      "Zero Labs AI Publisher turns a prompt into coordinated websites, portfolio pages, blog articles, and social content without reducing the product to a basic site builder.",
  },
  {
    eyebrow: "What it solves",
    title: "Fragmented publishing workflows",
    description:
      "Teams replace disconnected copy decks, CMS handoffs, and manual channel updates with one AI-native workflow that keeps structure, review, and distribution connected.",
  },
  {
    eyebrow: "Why it matters",
    title: "Distribution velocity with governance",
    description:
      "Businesses and creators can scale content operations while maintaining review checkpoints, channel readiness, and a clear path from ideation to measurable output.",
  },
];

const audienceCards: ContentCard[] = [
  {
    eyebrow: "For businesses",
    title: "Launch campaign surfaces faster",
    description: "Stand up high-quality landing pages, product explainers, and brand content with AI-assisted structure and publishing orchestration.",
  },
  {
    eyebrow: "For creators",
    title: "Turn one idea into many formats",
    description: "Convert a single prompt into a portfolio update, blog narrative, and social-ready messages that stay aligned across channels.",
  },
  {
    eyebrow: "For automated content teams",
    title: "Operate repeatable publishing systems",
    description: "Support approval, review, and insights loops that make AI-generated output manageable for recurring content programs.",
  },
];

const workflowSteps: ContentCard[] = [
  {
    eyebrow: "Prompt",
    title: "Start with a publishing brief",
    description: "Define the campaign, website, or content objective once and set the AI system in motion from a structured prompt.",
  },
  {
    eyebrow: "Generate",
    title: "Create website and content drafts",
    description: "Generate site sections, blog-ready copy, and supporting social messaging in one coordinated production pass.",
  },
  {
    eyebrow: "Review",
    title: "Apply editorial oversight",
    description: "Keep human review in the loop so brand quality, accuracy, and final edits stay under operator control.",
  },
  {
    eyebrow: "Publish",
    title: "Distribute across channels",
    description: "Prepare AI-generated assets for public launch across websites, blogs, and social touchpoints.",
  },
  {
    eyebrow: "Track",
    title: "Read the performance surface",
    description: "Use metrics and workflow visibility to understand where automation saves time and where the platform compounds output.",
  },
];

const insightMetrics: MetricCard[] = [
  { label: "Websites generated", value: "128", detail: "Illustrative dashboard volume for multi-site publishing programs" },
  { label: "Content pieces created", value: "3.4K", detail: "Drafted pages, blog articles, and social assets in the platform surface" },
  { label: "Publishing channels", value: "12", detail: "Web, blog, portfolio, and social distribution pathways represented in the workflow" },
  { label: "Automation coverage", value: "82%", detail: "Share of the publishing lifecycle that can be AI-assisted before final review" },
  { label: "Time saved", value: "41 hrs/wk", detail: "Illustrative operational lift for lean publishing teams" },
  { label: "AI workflow steps", value: "5", detail: "Prompt → Generate → Review → Publish → Track" },
];

const searchCards: ContentCard[] = [...productCards, ...audienceCards, ...workflowSteps].map((item) => ({
  title: item.title,
  description: item.description,
  eyebrow: item.eyebrow,
}));

function textIncludesQuery(text: string, query: string) {
  return text.toLowerCase().includes(query);
}

export function LandingPage() {
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();

  const filteredProductCards = useMemo(
    () =>
      normalizedQuery
        ? productCards.filter((card) => textIncludesQuery(`${card.eyebrow} ${card.title} ${card.description}`, normalizedQuery))
        : productCards,
    [normalizedQuery]
  );

  const filteredAudienceCards = useMemo(
    () =>
      normalizedQuery
        ? audienceCards.filter((card) => textIncludesQuery(`${card.eyebrow} ${card.title} ${card.description}`, normalizedQuery))
        : audienceCards,
    [normalizedQuery]
  );

  const filteredWorkflowSteps = useMemo(
    () =>
      normalizedQuery
        ? workflowSteps.filter((card) => textIncludesQuery(`${card.eyebrow} ${card.title} ${card.description}`, normalizedQuery))
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

  const searchResults = useMemo(
    () =>
      normalizedQuery
        ? searchCards.filter((card) => textIncludesQuery(`${card.eyebrow} ${card.title} ${card.description}`, normalizedQuery))
        : searchCards.slice(0, 3),
    [normalizedQuery]
  );

  const isFiltered = normalizedQuery.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <MarketingNav currentPath="/" />

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.2),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.16),_transparent_32%)]" />
          <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,420px)] lg:px-8 lg:py-28">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
                Investor-ready product surface
              </div>
              <div className="space-y-6">
                <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
                  AI-powered publishing infrastructure for websites, portfolios, blogs, and social content.
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
                  Zero Labs AI Publisher gives teams a premium prompt-to-publish system that generates digital surfaces,
                  coordinates review, and frames performance visibility like a real platform business.
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href="#workflow"
                  className="inline-flex items-center justify-center rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                >
                  Explore the workflow
                </Link>
                <Link
                  href="#insights"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  View platform insights
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-slate-400">Platform posture</p>
                  <p className="mt-2 text-xl font-semibold text-white">AI-native publishing layer</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-slate-400">Operational focus</p>
                  <p className="mt-2 text-xl font-semibold text-white">Structured review + distribution</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-slate-400">Value signal</p>
                  <p className="mt-2 text-xl font-semibold text-white">Faster publishing with visibility</p>
                </div>
              </div>
            </div>

            <aside className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Platform surface</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Publishing command center</h2>
                </div>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                  Workflow active
                </span>
              </div>
              <div className="mt-6 space-y-4">
                {[
                  "Prompt intake aligns site, blog, and social output.",
                  "Review checkpoints preserve editorial control.",
                  "Insights surface frames automation readiness for growth teams.",
                ].map((line) => (
                  <div key={line} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300">
                    {line}
                  </div>
                ))}
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {insightMetrics.slice(0, 4).map((metric) => (
                  <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{metric.label}</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
                    <p className="mt-2 text-sm text-slate-400">{metric.detail}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section id="search" className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Search the product surface</p>
                <h2 className="text-3xl font-semibold text-white">Find workflows, use cases, and platform signals instantly.</h2>
                <p className="text-slate-300">
                  Use a lightweight frontend search to focus the landing page on the product themes, customer segments, and
                  workflow stages that matter most.
                </p>
              </div>
              <div className="w-full max-w-xl">
                <label className="sr-only" htmlFor="landing-search">
                  Search the landing page
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="landing-search"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search publishing workflows, analytics, channels, or audiences"
                    className="min-h-12 flex-1 rounded-full border border-white/15 bg-slate-950/80 px-5 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-300/60"
                  />
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08]"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {searchResults.length > 0 ? (
                searchResults.map((card) => (
                  <article
                    key={card.title}
                    className="rounded-3xl border border-white/10 bg-slate-950/75 p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">{card.eyebrow}</p>
                    <h3 className="mt-3 text-xl font-semibold text-white">{card.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-400">{card.description}</p>
                  </article>
                ))
              ) : (
                <article className="rounded-3xl border border-dashed border-white/15 bg-slate-950/75 p-5 text-sm leading-7 text-slate-400 lg:col-span-3">
                  No landing page sections match that query yet. Try terms like publishing, workflow, insights, creators, or websites.
                </article>
              )}
            </div>
          </div>
        </section>

        {filteredProductCards.length > 0 ? (
          <section id="about" className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-8 lg:py-20">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">About the platform</p>
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">What Zero Labs AI Publisher is building.</h2>
              <p className="text-lg leading-8 text-slate-300">
                The platform is designed to help businesses, creators, and automated content teams generate AI-powered websites
                and orchestrate publishing workflows from one coordinated surface.
              </p>
            </div>
            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {filteredProductCards.map((card) => (
                <article key={card.title} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                  <p className="text-sm uppercase tracking-[0.18em] text-cyan-200">{card.eyebrow}</p>
                  <h3 className="mt-4 text-2xl font-semibold text-white">{card.title}</h3>
                  <p className="mt-4 text-base leading-7 text-slate-300">{card.description}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {filteredAudienceCards.length > 0 ? (
          <section className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Who it is for</p>
                <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Built for teams that need output, quality, and velocity.</h2>
              </div>
              <p className="max-w-2xl text-slate-300">
                AI-generated websites and automated content publishing only work at scale when the surrounding workflow supports
                review, repeatability, and multi-channel execution.
              </p>
            </div>
            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {filteredAudienceCards.map((card) => (
                <article key={card.title} className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
                  <p className="text-sm uppercase tracking-[0.18em] text-cyan-200">{card.eyebrow}</p>
                  <h3 className="mt-4 text-2xl font-semibold text-white">{card.title}</h3>
                  <p className="mt-4 text-base leading-7 text-slate-300">{card.description}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {filteredWorkflowSteps.length > 0 ? (
          <section id="workflow" className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-8 lg:py-20">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Platform workflow</p>
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">Prompt → Generate → Review → Publish → Track</h2>
              <p className="text-lg leading-8 text-slate-300">
                The publishing system is framed as an end-to-end operating loop, not a one-off content generator. Every stage is
                designed to make AI output more deployable.
              </p>
            </div>
            <div className="mt-8 grid gap-5 lg:grid-cols-5">
              {filteredWorkflowSteps.map((step, index) => (
                <article key={step.title} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm uppercase tracking-[0.18em] text-cyan-200">{step.eyebrow}</p>
                    <span className="text-sm text-slate-500">0{index + 1}</span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-300">{step.description}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {filteredInsightMetrics.length > 0 ? (
          <section id="insights" className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-8 lg:py-20">
            <div className="rounded-[2rem] border border-cyan-400/20 bg-cyan-400/[0.06] p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Insights</p>
                  <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                    A data-aware product surface for operator and investor conversations.
                  </h2>
                </div>
                <p className="max-w-2xl text-slate-300">
                  These metrics are illustrative product UI values for the marketing surface only. They are presented as demo
                  platform signals and are not connected to live production telemetry.
                </p>
              </div>
              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredInsightMetrics.map((metric) => (
                  <article key={metric.label} className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{metric.label}</p>
                    <p className="mt-4 text-4xl font-semibold text-white">{metric.value}</p>
                    <p className="mt-4 text-sm leading-7 text-slate-400">{metric.detail}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="mx-auto w-full max-w-7xl px-6 pb-20 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
              <div className="space-y-5">
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Vision</p>
                <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                  Zero Labs AI Publisher is positioning for the future of AI-powered publishing infrastructure.
                </h2>
                <p className="text-lg leading-8 text-slate-300">
                  The long-term opportunity is a platform where AI-generated websites, automated content publishing, and social
                  content automation are managed as one operating system for digital growth.
                </p>
                <p className="text-base leading-7 text-slate-400">
                  That future depends on treating publishing as infrastructure: structured generation, reviewable output,
                  channel-aware distribution, and an insights surface that helps teams scale automation responsibly.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-5">
                  <p className="text-sm font-medium text-white">AI-generated websites</p>
                  <p className="mt-2 text-sm leading-7 text-slate-400">
                    Structure, copy, and digital presentation are generated from a reusable system instead of manual rebuilds.
                  </p>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-5">
                  <p className="text-sm font-medium text-white">Automated content publishing</p>
                  <p className="mt-2 text-sm leading-7 text-slate-400">
                    Blog, website, and campaign publishing can be coordinated through one product surface with consistent review.
                  </p>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-5">
                  <p className="text-sm font-medium text-white">Social content automation</p>
                  <p className="mt-2 text-sm leading-7 text-slate-400">
                    Channel-ready content can be generated and shaped alongside website publishing instead of as a separate toolchain.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row">
              <Link
                href={routes.login}
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Enter the workspace
              </Link>
              <Link
                href="/blog"
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Read platform updates
              </Link>
            </div>

            {isFiltered ? (
              <p className="mt-6 text-sm text-slate-400">
                Search is filtering visible cards across the homepage. Clear the query to restore the full investor-ready surface.
              </p>
            ) : null}
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
