import Counter from "@/components/scroll/Counter";
import Reveal from "@/components/scroll/Reveal";

const stats = [
  { value: 500, suffix: "+", label: "Tile Collections" },
  { value: 15, suffix: "+", label: "Years Experience" },
  { value: 5000, suffix: "+", label: "Happy Customers" },
  { value: 32, suffix: "", label: "Counties Delivered" },
];

/** Dark numbers band — the story in four figures. */
export default function StatsBand() {
  return (
    <section className="relative overflow-hidden bg-navy py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(45,184,124,0.14),transparent_60%)]" />
      <Reveal
        className="relative mx-auto grid max-w-6xl grid-cols-2 gap-y-12 px-6 lg:grid-cols-4"
        stagger={0.1}
      >
        {stats.map((s) => (
          <div key={s.label} data-reveal className="text-center">
            <div className="display text-5xl text-white sm:text-6xl">
              <Counter value={s.value} suffix={s.suffix} />
            </div>
            <div className="label mt-3 text-green">{s.label}</div>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
