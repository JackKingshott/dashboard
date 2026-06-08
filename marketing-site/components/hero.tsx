import { ArrowRight, TrendingUp } from "lucide-react";

export function Hero() {
  return (
    <section className="section-glow relative overflow-hidden px-6 pb-24 pt-20 md:pt-28">
      <div className="mx-auto max-w-5xl text-center">
        <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/70">
          <TrendingUp className="h-3.5 w-3.5 text-[#8b7bff]" />
          Meta Ads Agency for fast-growing brands
        </div>

        <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl">
          We turn ad spend into{" "}
          <span className="glow-text">predictable revenue</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
          Scale Storm plans, creates and scales Meta (Facebook & Instagram) ad
          campaigns engineered to lower your cost per acquisition and grow
          your bottom line — month after month.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#contact"
            className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#06070d] transition-transform hover:scale-105"
          >
            Book your free strategy call
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="#results"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/5"
          >
            See our results
          </a>
        </div>

        <p className="mt-6 text-xs uppercase tracking-widest text-white/30">
          No long-term contracts · Performance-driven · Done-for-you
        </p>
      </div>
    </section>
  );
}
