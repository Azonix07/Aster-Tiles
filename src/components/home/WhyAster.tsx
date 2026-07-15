import Reveal from "@/components/scroll/Reveal";
import GridLines from "@/components/decor/GridLines";

const reasons = [
  {
    title: "Premium Quality",
    body: "Every tile and floor we stock is rigorously tested for durability, finish and long-term performance in Irish conditions.",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    title: "Donegal Showroom",
    body: "See tiles in person — under natural light, at true scale, with expert staff on hand at The Haw, Lifford.",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    title: "Fast Delivery",
    body: "Same-day despatch on in-stock items. Free nationwide delivery across Ireland, carefully packed every time.",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Expert Advice",
    body: "Decades of tiling experience, free of charge. We help you choose the right product for every room.",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
    ),
  },
  {
    title: "Smart Tile Calculator",
    body: "The visualiser counts exactly how many tiles you need — including a 10% waste buffer — so you never over-order.",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "AI Room Preview",
    body: "Upload a photo of your room and watch our AI re-lay your floor or walls in any tile we stock — before you spend a cent.",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
];

export default function WhyAster() {
  return (
    <section className="relative overflow-hidden border-y border-mist bg-white py-24">
      <GridLines size={64} opacity={0.5} />
      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal className="text-center">
          <span data-reveal className="label text-green">
            Why Choose Aster
          </span>
          <h2 data-reveal className="display mx-auto mt-3 max-w-2xl text-4xl text-navy sm:text-5xl">
            Quality you can <em className="not-italic text-green">see &amp; feel</em>
          </h2>
          <p data-reveal className="mx-auto mt-4 max-w-xl text-muted">
            We handpick every product in our range — because your home deserves
            nothing less than the best.
          </p>
        </Reveal>

        <Reveal className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
          {reasons.map((r) => (
            <div
              key={r.title}
              data-reveal
              className="group rounded-2xl border border-mist bg-off p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-green hover:bg-white hover:shadow-[0_12px_30px_rgba(45,184,124,0.14)]"
            >
              <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-xl border border-green/25 bg-green/8 text-green transition-colors duration-300 ease-out group-hover:bg-green group-hover:text-white motion-reduce:transition-none">
                {r.icon}
              </div>
              <h3 className="font-display text-lg font-bold text-navy">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{r.body}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
