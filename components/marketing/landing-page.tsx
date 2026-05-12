import Image from "next/image";
import Link from "next/link";
import { routes } from "@/config/routes";
import { MarketingFooter } from "./marketing-footer";
import { MarketingNav } from "./marketing-nav";

type FeatureCard = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  backgroundImage: string;
};

type StatCard = {
  label: string;
  value: string;
  detail: string;
};

type PricingTier = {
  name: string;
  summary: string;
  detail: string;
  features: string[];
};

const wrapperClass = "mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-10 xl:px-12";

const featureCards: FeatureCard[] = [
  {
    id: "product",
    eyebrow: "Product",
    title: "AI Website Generation",
    description:
      "Convert one prompt into a polished site surface with hero positioning, brand-aligned sections, and deployment-ready structure.",
    ctaLabel: "Learn more",
    href: "#platform",
    backgroundImage: "/images/Background Image.svg",
  },
  {
    id: "platform",
    eyebrow: "Platform",
    title: "Automated Publishing Workflow",
    description:
      "Coordinate prompts, review steps, and release actions in one AI-native publishing flow without turning the homepage into a dashboard.",
    ctaLabel: "View workflow",
    href: "#insights",
    backgroundImage: "/images/Banner Light.svg",
  },
];

const platformPanels = [
  {
    eyebrow: "Prompt systems",
    title: "Structured brief intake",
    description: "Capture direction once, then distribute it into the website, blog, and supporting automation surfaces.",
  },
  {
    eyebrow: "Review control",
    title: "Human checkpoints",
    description: "Keep approval flow and publishing oversight visible while the visual layer stays calm, premium, and spacious.",
  },
  {
    eyebrow: "Release motion",
    title: "Publishing orchestration",
    description: "Move from idea to live AI operations with cleaner transitions across assets, destinations, and launch timing.",
  },
] as const;

const insightCards: StatCard[] = [
  { label: "Generated websites", value: "128", detail: "Illustrative output volume for premium AI-led site creation." },
  { label: "Publishing workflows", value: "24/7", detail: "Automated release motion with human review at the right checkpoints." },
  { label: "Approval velocity", value: "82%", detail: "Representative automation leverage before final human publishing approval." },
] as const;

const pricingTiers: PricingTier[] = [
  {
    name: "Starter",
    summary: "Launch the core prompt-to-site workflow.",
    detail: "For focused teams building public-facing AI websites with clean review flow.",
    features: ["Website generation", "Core publishing workflow", "Login-ready workspace access"],
  },
  {
    name: "Growth",
    summary: "Expand into orchestrated publishing operations.",
    detail: "For teams that need more release rhythm, content scale, and structured handoff control.",
    features: ["Multi-surface generation", "Approval handoffs", "Insights and release visibility"],
  },
  {
    name: "Platform",
    summary: "Operate a premium AI publishing engine.",
    detail: "For organizations positioning the product as a cinematic AI automation layer, not a cramped dashboard.",
    features: ["Brand-aligned orchestration", "Governed automation", "Investor-ready product posture"],
  },
] as const;

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.82),_rgba(3,7,18,0.98)_58%),radial-gradient(circle_at_20%_15%,_rgba(16,185,129,0.12),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.12),_transparent_24%)]" />
      <div className="relative">
        <MarketingNav currentPath="/" />

        <main className="overflow-x-hidden pb-14 sm:pb-20">
          <div className={wrapperClass}>
            <section id="product" className="relative mt-8 overflow-hidden rounded-[2.75rem] border-[10px] border-white/80 bg-[#071427] shadow-[0_35px_120px_rgba(2,6,23,0.75)] sm:mt-10 sm:border-[14px] lg:min-h-[72vh]">
              <div className="absolute inset-0">
                <Image src="/images/Background Image BNW.svg" alt="" fill priority className="object-cover opacity-20" />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,16,35,0.96)_0%,rgba(6,16,35,0.9)_42%,rgba(6,16,35,0.44)_68%,rgba(6,16,35,0.06)_100%)]" />
                <div className="absolute inset-y-0 left-0 w-full bg-[radial-gradient(circle_at_left_center,_rgba(16,185,129,0.12),_transparent_34%)]" />
              </div>

              <div className="relative flex min-h-[620px] items-center px-6 py-10 sm:px-10 sm:py-12 lg:px-16 lg:py-16 xl:px-20">
                <div className="max-w-[640px] space-y-8 lg:space-y-10">
                  <div className="flex items-center gap-4 text-sm font-semibold tracking-[0.28em] text-white uppercase">
                    <Image src="/images/Chip Icon Logo.svg" alt="ZeroLabsAI" width={52} height={52} className="h-11 w-11 sm:h-[3.25rem] sm:w-[3.25rem]" priority />
                    <span>ZeroLabsAI</span>
                  </div>

                  <div className="space-y-5">
                    <p className="text-xs font-semibold tracking-[0.35em] text-emerald-200 uppercase sm:text-sm">Premium AI automation for public-facing publishing</p>
                    <h1 className="max-w-[9ch] text-5xl font-black leading-[0.9] tracking-tight text-white uppercase sm:text-6xl lg:text-7xl xl:text-8xl">
                      Turn prompts into published AI websites
                    </h1>
                    <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg lg:text-xl">
                      A cinematic AI publisher surface that frames generation, workflow, and launch control inside one clean premium product identity.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                    <Link
                      href={routes.signup}
                      className="inline-flex min-h-14 items-center justify-center rounded-full bg-white px-8 text-xs font-semibold tracking-[0.32em] text-slate-950 uppercase transition hover:bg-emerald-100 sm:px-10"
                    >
                      Start building
                    </Link>
                    <Link
                      href="#platform"
                      className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-8 text-xs font-semibold tracking-[0.32em] text-white uppercase transition hover:border-emerald-300/45 hover:bg-emerald-300/10 sm:px-10"
                    >
                      Learn more
                    </Link>
                  </div>
                </div>

                <div className="pointer-events-none absolute inset-y-0 right-[-26%] hidden w-[72%] items-center md:flex lg:right-[-18%] lg:w-[64%] xl:right-[-10%] xl:w-[58%]">
                  <Image src="/images/FULL ROBOT BODY.svg" alt="ZeroLabsAI robot" fill className="object-contain object-right" priority />
                </div>
              </div>
            </section>

            <section className="mt-10 grid gap-8 lg:mt-12 lg:grid-cols-2 lg:gap-10">
              {featureCards.map((card) => (
                <article
                  key={card.title}
                  id={card.id === "platform" ? "platform" : undefined}
                  className="relative overflow-hidden rounded-[2rem] border-[6px] border-white/55 bg-slate-950/80 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.55)] sm:p-8 lg:min-h-[360px]"
                >
                  <div className="absolute inset-0">
                    <Image src={card.backgroundImage} alt="" fill className="object-cover opacity-20" />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,20,39,0.55)_0%,rgba(3,7,18,0.92)_70%,rgba(3,7,18,0.96)_100%)]" />
                  </div>
                  <div className="relative flex h-full flex-col justify-between gap-10">
                    <div className="space-y-4">
                      <p className="text-xs font-semibold tracking-[0.32em] text-emerald-200 uppercase">{card.eyebrow}</p>
                      <h2 className="max-w-[14ch] text-3xl leading-tight font-semibold text-white sm:text-4xl">{card.title}</h2>
                      <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-base">{card.description}</p>
                    </div>
                    <Link
                      href={card.href}
                      className="inline-flex w-fit min-h-12 items-center justify-center rounded-full bg-white px-6 text-xs font-semibold tracking-[0.28em] text-slate-950 uppercase transition hover:bg-emerald-100"
                    >
                      {card.ctaLabel}
                    </Link>
                  </div>
                </article>
              ))}
            </section>

            <section className="mt-10 rounded-[2.5rem] border border-white/10 bg-slate-950/65 px-6 py-8 shadow-[0_20px_70px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:px-8 lg:mt-12 lg:px-10 lg:py-10">
              <div className="max-w-3xl space-y-4">
                <p className="text-xs font-semibold tracking-[0.32em] text-emerald-200 uppercase">Platform</p>
                <h2 className="text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">A centered product story with clean operational depth below the fold.</h2>
                <p className="text-sm leading-7 text-slate-300 sm:text-base lg:text-lg">
                  The homepage stays spacious and cinematic up front, then introduces the automation layers in a more disciplined, premium rhythm.
                </p>
              </div>
              <div className="mt-8 grid gap-5 lg:grid-cols-3 lg:gap-6">
                {platformPanels.map((panel) => (
                  <article key={panel.title} className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6">
                    <p className="text-xs font-semibold tracking-[0.28em] text-emerald-200 uppercase">{panel.eyebrow}</p>
                    <h3 className="mt-4 text-2xl font-semibold text-white">{panel.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-slate-300">{panel.description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section id="insights" className="mt-10 rounded-[2.5rem] border border-white/10 bg-slate-950/65 px-6 py-8 shadow-[0_20px_70px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:px-8 lg:mt-12 lg:px-10 lg:py-10">
              <div className="max-w-3xl space-y-4">
                <p className="text-xs font-semibold tracking-[0.32em] text-emerald-200 uppercase">Insights</p>
                <h2 className="text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">Move analytics lower so the hero stays focused on product positioning.</h2>
                <p className="text-sm leading-7 text-slate-300 sm:text-base lg:text-lg">
                  These values stay available for storytelling, but they no longer compete with the headline or dilute the cinematic first impression.
                </p>
              </div>
              <div className="mt-8 grid gap-5 lg:grid-cols-3 lg:gap-6">
                {insightCards.map((card) => (
                  <article key={card.label} className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6">
                    <p className="text-xs font-semibold tracking-[0.28em] text-slate-400 uppercase">{card.label}</p>
                    <p className="mt-4 text-4xl font-semibold tracking-tight text-white">{card.value}</p>
                    <p className="mt-4 text-sm leading-7 text-slate-300">{card.detail}</p>
                  </article>
                ))}
              </div>
            </section>

            <section id="pricing" className="mt-10 rounded-[2.5rem] border border-white/10 bg-slate-950/65 px-6 py-8 shadow-[0_20px_70px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:px-8 lg:mt-12 lg:px-10 lg:py-10">
              <div className="max-w-3xl space-y-4">
                <p className="text-xs font-semibold tracking-[0.32em] text-emerald-200 uppercase">Pricing</p>
                <h2 className="text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">Three pricing paths that preserve the premium AI automation posture.</h2>
                <p className="text-sm leading-7 text-slate-300 sm:text-base lg:text-lg">
                  Keep the page public-facing and polished while still giving visitors a clear progression from entry tier to enterprise-scale publishing operations.
                </p>
              </div>
              <div className="mt-8 grid gap-5 lg:grid-cols-3 lg:gap-6">
                {pricingTiers.map((tier) => (
                  <article key={tier.name} className="flex h-full flex-col rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6">
                    <p className="text-xs font-semibold tracking-[0.28em] text-emerald-200 uppercase">{tier.name}</p>
                    <h3 className="mt-4 text-2xl font-semibold text-white">{tier.summary}</h3>
                    <p className="mt-4 text-sm leading-7 text-slate-300">{tier.detail}</p>
                    <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-200">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <span className="mt-2 h-2 w-2 rounded-full bg-emerald-300" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-10 lg:mt-12">
              <div className="overflow-hidden rounded-[2.5rem] border border-emerald-300/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(7,20,39,0.86)_38%,rgba(3,7,18,0.96)_100%)] px-6 py-10 text-center shadow-[0_20px_70px_rgba(2,6,23,0.5)] sm:px-8 lg:px-10 lg:py-12">
                <p className="text-xs font-semibold tracking-[0.32em] text-emerald-100 uppercase">Next step</p>
                <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">
                  Launch a premium AI publishing workflow with a cleaner homepage and a clearer story.
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base lg:text-lg">
                  Keep the public entry point cinematic while preserving the existing login and blog routes for downstream product access.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                  <Link
                    href={routes.login}
                    className="inline-flex min-h-14 items-center justify-center rounded-full bg-white px-8 text-xs font-semibold tracking-[0.32em] text-slate-950 uppercase transition hover:bg-emerald-100"
                  >
                    Login
                  </Link>
                  <Link
                    href="/blog"
                    className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] px-8 text-xs font-semibold tracking-[0.32em] text-white uppercase transition hover:border-emerald-300/45 hover:bg-emerald-300/10"
                  >
                    Visit blog
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </main>

        <MarketingFooter />
      </div>
    </div>
  );
}
