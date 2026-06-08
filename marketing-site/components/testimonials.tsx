const testimonials = [
  {
    quote:
      "Scale Storm took our Meta ads from break-even to a 4.6x ROAS in under three months. The weekly reporting alone is worth it — we finally know what's working.",
    name: "Sarah Mitchell",
    role: "Founder, Lumen Skincare",
  },
  {
    quote:
      "They don't just run ads, they think like operators. Our cost per lead dropped by 41% and the creative they ship every week keeps performance fresh.",
    name: "Daniel Reyes",
    role: "CEO, Forge Fitness",
  },
  {
    quote:
      "Best agency we've worked with, full stop. Communication is tight, the strategy is sound, and the results speak for themselves.",
    name: "Priya Anand",
    role: "Head of Growth, Northbound",
  },
];

export function Testimonials() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Brands that scaled with us
          </h2>
          <p className="mt-4 text-white/55">
            We measure success the same way you do — in revenue, margin and
            growth you can see.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col justify-between rounded-2xl border border-white/8 bg-white/[0.02] p-8"
            >
              <blockquote className="text-sm leading-relaxed text-white/70">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6">
                <p className="text-sm font-semibold text-white">{t.name}</p>
                <p className="text-xs text-white/40">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
