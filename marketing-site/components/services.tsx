import { Target, PenTool, LineChart, Repeat } from "lucide-react";

const services = [
  {
    icon: Target,
    title: "Meta Ads Management",
    description:
      "Full setup, targeting, bidding and ongoing optimization of your Facebook & Instagram campaigns — built around your margins, not vanity metrics.",
  },
  {
    icon: PenTool,
    title: "Creative That Converts",
    description:
      "Scroll-stopping ad creative — video, static and UGC — tested in batches every week so we always know what's working.",
  },
  {
    icon: LineChart,
    title: "Tracking & Reporting",
    description:
      "Clean attribution, custom dashboards and weekly reporting so you always know exactly what your ad spend is producing.",
  },
  {
    icon: Repeat,
    title: "Funnel & Offer Optimization",
    description:
      "We don't just run ads — we help refine your offer, landing pages and follow-up to maximize what each click is worth.",
  },
];

export function Services() {
  return (
    <section id="services" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to scale on Meta
          </h2>
          <p className="mt-4 text-white/55">
            One team, one system — strategy, creative, media buying and
            reporting all working together toward the same number: your
            return on ad spend.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {services.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-2xl border border-white/8 bg-white/[0.02] p-8 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#6d5bff]/20 to-[#4f9bff]/20">
                <Icon className="h-5.5 w-5.5 text-[#8b7bff]" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-white/50">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
