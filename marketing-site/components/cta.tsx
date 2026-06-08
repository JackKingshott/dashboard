import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="px-6 py-24">
      <div className="section-glow mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/[0.03] px-8 py-16 text-center sm:px-16">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to turn ad spend into{" "}
          <span className="glow-text">predictable growth?</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/55">
          Book a free, no-pressure strategy call. We&apos;ll review your current
          ads and tell you honestly whether — and how — we can help you scale.
        </p>
        <a
          href="tel:+447862240214"
          className="group mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#06070d] transition-transform hover:scale-105"
        >
          Book your free strategy call
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </section>
  );
}
