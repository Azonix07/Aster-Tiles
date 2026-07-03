import Reveal from "@/components/scroll/Reveal";
import { getContent } from "@/lib/db";

export default function Testimonials() {
  const { testimonials } = getContent();
  return (
    <section className="bg-off py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="text-center">
          <span data-reveal className="label text-green">
            Customer Reviews
          </span>
          <h2 data-reveal className="display mx-auto mt-3 max-w-2xl text-4xl text-navy sm:text-5xl">
            What our customers say
          </h2>
        </Reveal>
      </div>

      <div className="mt-14 overflow-hidden">
        <div className="marquee-track items-stretch gap-6 pl-6">
          {[...testimonials, ...testimonials].map((t, i) => (
            <figure
              key={i}
              className="flex w-[340px] shrink-0 flex-col justify-between rounded-2xl border border-mist bg-white p-7 shadow-sm sm:w-[400px]"
            >
              <div>
                <div className="text-gold" aria-label="5 star review">★★★★★</div>
                <blockquote className="mt-4 text-[0.92rem] leading-relaxed text-body">
                  “{t.quote}”
                </blockquote>
              </div>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy font-display text-sm font-bold text-white">
                  {t.name[0]}
                </span>
                <span>
                  <span className="block text-sm font-bold text-navy">{t.name}</span>
                  <span className="block text-xs text-muted">{t.location}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
