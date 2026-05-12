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

const wrapperClass = "mx-auto w-full max-w-[1600px]";
const shellStyle = {
  paddingInline: "clamp(16px, 2vw, 40px)",
  paddingBlock: "clamp(24px, 3vw, 40px)",
};
const heroStyle = {
  marginTop: 40,
};
const heroInnerStyle = {
  padding: "clamp(48px, 6vw, 80px) clamp(24px, 5vw, 96px)",
};
const featureGridStyle = {
  marginTop: 40,
};
const cardStyle = {
  padding: "clamp(32px, 4vw, 40px)",
};
const surfaceStyle = {
  marginTop: 40,
  padding: "clamp(32px, 4vw, 40px) clamp(24px, 3vw, 40px)",
};
const panelGridStyle = {
  marginTop: 32,
};
const panelStyle = {
  padding: 24,
};
const ctaSectionStyle = {
  marginTop: 40,
};
const ctaPanelStyle = {
  padding: "clamp(40px, 5vw, 48px) clamp(24px, 3vw, 40px)",
};
const footerWrapStyle = {
  marginTop: 40,
};
const primaryButtonStyle = {
  paddingInline: 40,
};
const secondaryButtonStyle = {
  paddingInline: 40,
};

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
    <main className="min-h-screen overflow-x-hidden bg-[#071427] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.82),_rgba(3,7,18,0.98)_58%),radial-gradient(circle_at_20%_15%,_rgba(16,185,129,0.12),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.12),_transparent_24%)]" />
      <section className={`${wrapperClass} relative`} style={shellStyle}>
        <MarketingNav currentPath="/" contained />

        <section
          id="product"
          className="relative overflow-hidden rounded-[3rem] border-[8px] border-slate-100/90 bg-[#09203a] shadow-[0_35px_120px_rgba(2,6,23,0.75)] sm:border-[10px]"
          style={heroStyle}
        >
          <div className="absolute inset-0">
            <Image src="/images/Background Image BNW.svg" alt="" fill priority className="object-cover opacity-20" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,16,35,0.94)_0%,rgba(6,16,35,0.88)_44%,rgba(6,16,35,0.44)_72%,rgba(6,16,35,0.12)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_left_center,_rgba(16,185,129,0.14),_transparent_34%)]" />
          </div>

          <div className="relative min-h-[620px] lg:min-h-[680px]" style={heroInnerStyle}>
            <div className="relative z-10 max-w-[720px]">
              <div className="flex items-center gap-4 text-base font-black tracking-[0.24em] text-white uppercase" style={{ marginBottom: 32 }}>
                <Image src="/images/Chip Icon Logo.svg" alt="ZeroLabsAI" width={52} height={52} className="h-11 w-11 sm:h-[3.25rem] sm:w-[3.25rem]" priority />
                <span>ZeroLabsAI</span>
              </div>

              <p className="text-xs font-semibold tracking-[0.35em] text-slate-200 uppercase sm:text-sm">Premium AI automation for public-facing publishing</p>
              <h1 className="max-w-[760px] text-5xl font-black leading-[0.9] tracking-[-0.04em] text-white uppercase sm:text-6xl md:text-7xl lg:text-8xl" style={{ marginTop: 24 }}>
                Turn prompts into published AI websites
              </h1>
              <p className="max-w-xl text-base leading-8 text-slate-200 sm:text-lg" style={{ marginTop: 32 }}>
                A cinematic AI publisher surface that frames generation, workflow, and launch control inside one clean premium product identity.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap" style={{ marginTop: 40 }}>
                <Link
                  href={routes.signup}
                  className="inline-flex min-h-14 items-center justify-center rounded-full bg-slate-100 text-xs font-black tracking-[0.32em] text-slate-950 uppercase transition hover:bg-white"
                  style={primaryButtonStyle}
                >
                  Start building
                </Link>
                <Link
                  href="#platform"
                  className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-xs font-black tracking-[0.32em] text-white uppercase transition hover:border-white/30 hover:bg-white/10"
                  style={secondaryButtonStyle}
                >
                  Learn more
                </Link>
              </div>
            </div>

            <Image
              src="/images/FULL ROBOT BODY.svg"
              alt=""
              width={720}
              height={980}
              priority
              className="pointer-events-none absolute right-[-4%] bottom-0 hidden h-[82%] w-auto max-w-none opacity-95 lg:block xl:right-0 xl:h-[88%]"
            />
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-2" style={featureGridStyle}>
          {featureCards.map((card) => (
            <article
              key={card.title}
              id={card.id === "platform" ? "platform" : undefined}
              className="relative min-h-[420px] overflow-hidden rounded-[2rem] border-[8px] border-slate-100/90 bg-white/10 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur"
              style={cardStyle}
            >
              <div className="absolute inset-0">
                <Image src={card.backgroundImage} alt="" fill className="object-cover opacity-20" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,20,39,0.48)_0%,rgba(7,20,39,0.88)_100%)]" />
              </div>
              <div className="relative flex h-full flex-col justify-between gap-10">
                <div className="space-y-4">
                  <p className="text-xs font-semibold tracking-[0.32em] text-slate-200 uppercase">{card.eyebrow}</p>
                  <h2 className="max-w-[14ch] text-3xl font-black leading-tight tracking-[0.08em] text-white uppercase sm:text-4xl">{card.title}</h2>
                  <p className="max-w-xl text-sm leading-7 text-slate-200 sm:text-base">{card.description}</p>
                </div>
                <Link
                  href={card.href}
                  className="inline-flex w-fit min-h-12 items-center justify-center rounded-full bg-slate-100 text-xs font-black tracking-[0.3em] text-slate-950 uppercase transition hover:bg-white"
                  style={{ paddingInline: 40 }}
                >
                  {card.ctaLabel}
                </Link>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-[2.5rem] border border-white/10 bg-slate-950/65 shadow-[0_20px_70px_rgba(2,6,23,0.45)] backdrop-blur-xl" style={surfaceStyle}>
              <div className="max-w-3xl space-y-4">
                <p className="text-xs font-semibold tracking-[0.32em] text-emerald-200 uppercase">Platform</p>
                <h2 className="text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">A centered product story with clean operational depth below the fold.</h2>
                <p className="text-sm leading-7 text-slate-300 sm:text-base lg:text-lg">
                  The homepage stays spacious and cinematic up front, then introduces the automation layers in a more disciplined, premium rhythm.
                </p>
              </div>
               <div className="grid gap-5 lg:grid-cols-3 lg:gap-6" style={panelGridStyle}>
                {platformPanels.map((panel) => (
                   <article key={panel.title} className="rounded-[1.75rem] border border-white/10 bg-white/[0.03]" style={panelStyle}>
                    <p className="text-xs font-semibold tracking-[0.28em] text-emerald-200 uppercase">{panel.eyebrow}</p>
                     <h3 className="text-2xl font-semibold text-white" style={{ marginTop: 16 }}>{panel.title}</h3>
                     <p className="text-sm leading-7 text-slate-300" style={{ marginTop: 16 }}>{panel.description}</p>
                  </article>
                ))}
              </div>
        </section>

        <section id="insights" className="rounded-[2.5rem] border border-white/10 bg-slate-950/65 shadow-[0_20px_70px_rgba(2,6,23,0.45)] backdrop-blur-xl" style={surfaceStyle}>
              <div className="max-w-3xl space-y-4">
                <p className="text-xs font-semibold tracking-[0.32em] text-emerald-200 uppercase">Insights</p>
                <h2 className="text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">Move analytics lower so the hero stays focused on product positioning.</h2>
                <p className="text-sm leading-7 text-slate-300 sm:text-base lg:text-lg">
                  These values stay available for storytelling, but they no longer compete with the headline or dilute the cinematic first impression.
                </p>
              </div>
               <div className="grid gap-5 lg:grid-cols-3 lg:gap-6" style={panelGridStyle}>
                {insightCards.map((card) => (
                   <article key={card.label} className="rounded-[1.75rem] border border-white/10 bg-white/[0.03]" style={panelStyle}>
                    <p className="text-xs font-semibold tracking-[0.28em] text-slate-400 uppercase">{card.label}</p>
                     <p className="text-4xl font-semibold tracking-tight text-white" style={{ marginTop: 16 }}>{card.value}</p>
                     <p className="text-sm leading-7 text-slate-300" style={{ marginTop: 16 }}>{card.detail}</p>
                  </article>
                ))}
              </div>
        </section>

        <section id="pricing" className="rounded-[2.5rem] border border-white/10 bg-slate-950/65 shadow-[0_20px_70px_rgba(2,6,23,0.45)] backdrop-blur-xl" style={surfaceStyle}>
              <div className="max-w-3xl space-y-4">
                <p className="text-xs font-semibold tracking-[0.32em] text-emerald-200 uppercase">Pricing</p>
                <h2 className="text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">Three pricing paths that preserve the premium AI automation posture.</h2>
                <p className="text-sm leading-7 text-slate-300 sm:text-base lg:text-lg">
                  Keep the page public-facing and polished while still giving visitors a clear progression from entry tier to enterprise-scale publishing operations.
                </p>
              </div>
               <div className="grid gap-5 lg:grid-cols-3 lg:gap-6" style={panelGridStyle}>
                {pricingTiers.map((tier) => (
                   <article key={tier.name} className="flex h-full flex-col rounded-[1.75rem] border border-white/10 bg-white/[0.03]" style={panelStyle}>
                    <p className="text-xs font-semibold tracking-[0.28em] text-emerald-200 uppercase">{tier.name}</p>
                     <h3 className="text-2xl font-semibold text-white" style={{ marginTop: 16 }}>{tier.summary}</h3>
                     <p className="text-sm leading-7 text-slate-300" style={{ marginTop: 16 }}>{tier.detail}</p>
                     <ul className="space-y-3 text-sm leading-6 text-slate-200" style={{ marginTop: 24 }}>
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

        <section style={ctaSectionStyle}>
          <div
            className="overflow-hidden rounded-[2.5rem] border border-emerald-300/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(7,20,39,0.86)_38%,rgba(3,7,18,0.96)_100%)] text-center shadow-[0_20px_70px_rgba(2,6,23,0.5)]"
            style={ctaPanelStyle}
          >
            <p className="text-xs font-semibold tracking-[0.32em] text-emerald-100 uppercase">Next step</p>
            <h2 className="mx-auto max-w-3xl text-3xl font-semibold text-white sm:text-4xl lg:text-5xl" style={{ marginTop: 16 }}>
              Launch a premium AI publishing workflow with a cleaner homepage and a clearer story.
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-200 sm:text-base lg:text-lg" style={{ marginTop: 16 }}>
              Keep the public entry point cinematic while preserving the existing login and blog routes for downstream product access.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row" style={{ marginTop: 32 }}>
              <Link
                href={routes.login}
                className="inline-flex min-h-14 items-center justify-center rounded-full bg-white text-xs font-semibold tracking-[0.32em] text-slate-950 uppercase transition hover:bg-emerald-100"
                style={{ paddingInline: 32 }}
              >
                Login
              </Link>
              <Link
                href="/blog"
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-xs font-semibold tracking-[0.32em] text-white uppercase transition hover:border-emerald-300/45 hover:bg-emerald-300/10"
                style={{ paddingInline: 32 }}
              >
                Visit blog
              </Link>
            </div>
          </div>
        </section>

        <div style={footerWrapStyle}>
          <MarketingFooter contained />
        </div>
      </section>
    </main>
  );
}
