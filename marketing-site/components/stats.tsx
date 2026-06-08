const stats = [
  { value: "$10M+", label: "Ad spend managed" },
  { value: "4.2x", label: "Average ROAS" },
  { value: "120+", label: "Brands scaled" },
  { value: "38%", label: "Avg. drop in CPA" },
];

export function Stats() {
  return (
    <section id="results" className="border-y border-white/5 bg-white/[0.02] px-6 py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="glow-text text-3xl font-bold sm:text-4xl">{s.value}</p>
            <p className="mt-2 text-sm text-white/50">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
