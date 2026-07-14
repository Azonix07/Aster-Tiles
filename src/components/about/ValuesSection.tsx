import Reveal from "@/components/scroll/Reveal";

const values = [
  {
    n: "01",
    title: "Honest advice",
    body: "We'd rather talk you out of the wrong tile than sell you one. Our advice is free, unhurried and based on decades of knowing what actually works in Irish homes — no commission, no pressure, no jargon.",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z" />
      </svg>
    ),
  },
  {
    n: "02",
    title: "Quality that lasts",
    body: "Every tile, plank and bathroom suite we stock is chosen for how it performs years down the line — tested for durability, slip resistance and finish in real Irish conditions, not just how it looks in a brochure.",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    n: "03",
    title: "Local & proud",
    body: "We live where you live. Born on The Haw in Lifford and proudly Donegal, we back local trades, know local homes — and still deliver free to every one of Ireland's 32 counties.",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

/** Three wide cards — what Aster stands for. */
export default function ValuesSection() {
  return (
    <section className="bg-white py-24 sm:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal className="text-center">
          <span data-reveal className="label text-green">
            What We Stand For
          </span>
          <h2 data-reveal className="display mx-auto mt-3 max-w-xl text-4xl text-navy sm:text-5xl">
            The Aster <em className="not-italic text-green">way</em>
          </h2>
        </Reveal>

        <Reveal className="mt-14 space-y-6" stagger={0.12}>
          {values.map((v) => (
            <div
              key={v.n}
              data-reveal
              className="group flex flex-col gap-6 rounded-2xl border border-mist bg-off p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-green hover:shadow-[0_14px_36px_rgba(45,184,124,0.16)] sm:flex-row sm:items-center sm:gap-9 sm:p-10"
            >
              <div className="flex shrink-0 items-center gap-6 sm:flex-col sm:items-start sm:gap-4">
                <span className="font-display text-sm font-bold tracking-[0.2em] text-mist transition-colors duration-300 group-hover:text-green">
                  {v.n}
                </span>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-green/25 bg-green/8 text-green">
                  {v.icon}
                </div>
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-navy sm:text-2xl">
                  {v.title}
                </h3>
                <p className="mt-2.5 max-w-2xl leading-relaxed text-muted">
                  {v.body}
                </p>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
