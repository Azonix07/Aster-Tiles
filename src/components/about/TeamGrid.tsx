import Image from "next/image";
import Reveal from "@/components/scroll/Reveal";
import { getContent } from "@/lib/db";

/** The four faces of Aster — portrait cards with a gradient nameplate. */
export default function TeamGrid() {
  const { staff } = getContent();
  return (
    <section className="bg-off py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="text-center">
          <span data-reveal className="label text-green">
            The Aster Team
          </span>
          <h2 data-reveal className="display mx-auto mt-3 max-w-2xl text-4xl text-navy sm:text-5xl">
            Meet the people{" "}
            <em className="not-italic text-green">behind the tiles</em>
          </h2>
          <p data-reveal className="mx-auto mt-4 max-w-xl text-muted">
            Four specialists, decades of combined experience — and every one
            of them on the floor of the Lifford showroom, ready to help.
          </p>
        </Reveal>

        <Reveal
          className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
          stagger={0.1}
        >
          {staff.map((m) => (
            <div key={m.id} data-reveal className="group">
              <div className="relative overflow-hidden rounded-2xl transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:shadow-lift">
                <div className="relative aspect-[3/4]">
                  <Image
                    src={m.photo}
                    alt={`${m.name}, ${m.role} at Aster Tiles`}
                    fill
                    sizes="(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 90vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
                {/* gradient nameplate */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 via-ink/45 to-transparent px-5 pt-20 pb-5">
                  <div className="font-display text-xl font-bold text-white">
                    {m.name}
                  </div>
                  <div className="label mt-1.5 text-green">{m.role}</div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted">{m.bio}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
