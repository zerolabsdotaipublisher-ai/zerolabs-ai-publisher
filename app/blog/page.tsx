import Link from "next/link";
import { routes } from "@/config/routes";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <MarketingNav currentPath="/blog" />
      <main className="marketing-shell flex w-full flex-col gap-10 py-20">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 lg:p-12">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Blog</p>
          <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">AI publishing insights, platform updates, and automation strategy coming soon.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            This public blog entry point is ready for future thought leadership, product releases, and operating-system-level
            commentary about AI-powered publishing infrastructure.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href={routes.home}
              className="inline-flex items-center justify-center rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              Return to homepage
            </Link>
            <Link
              href={`${routes.home}#insights`}
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              Review platform insights
            </Link>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {[
            "Publishing infrastructure commentary",
            "Automation playbooks for multi-channel teams",
            "Product updates for AI-native content operations",
          ].map((item) => (
            <article key={item} className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
              <p className="text-sm uppercase tracking-[0.18em] text-cyan-200">Planned coverage</p>
              <h2 className="mt-4 text-2xl font-semibold text-white">{item}</h2>
            </article>
          ))}
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
