const steps = [
  {
    number: "01",
    title: "Strategy call",
    description:
      "We dig into your business, margins, current ads and goals to figure out if — and how — we can scale you profitably.",
  },
  {
    number: "02",
    title: "Build & launch",
    description:
      "Our team builds your tracking, creative and campaign structure, then launches with a clear testing roadmap.",
  },
  {
    number: "03",
    title: "Optimize weekly",
    description:
      "We review performance every week, kill what's not working, double down on what is, and ship new creative on a steady cadence.",
  },
  {
    number: "04",
    title: "Scale with confidence",
    description:
      "As your numbers prove out, we scale spend in a controlled way — protecting your ROAS while growing your revenue.",
  },
];

export function Process() {
  return (
    <section id="process" className="border-y border-white/5 bg-white/[0.02] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How we work together
          </h2>
          <p className="mt-4 text-white/55">
            A simple, transparent process built to get you to profitable
            scale as fast as possible — and keep you there.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.number} className="rounded-2xl border border-white/8 bg-[#06070d] p-7">
              <span className="glow-text text-2xl font-bold">{step.number}</span>
              <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-white/50">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
