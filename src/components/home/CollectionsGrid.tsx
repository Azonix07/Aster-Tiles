import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/scroll/Reveal";
import Parallax from "@/components/scroll/Parallax";
import StatsStrip from "@/components/home/StatsStrip";
import { getContent } from "@/lib/db";

/** The six departments as a clean card grid with deep parallax and glass elements. */
export default async function CollectionsGrid() {
  const { collections } = await getContent();
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden bg-off">
      {/* Background Graphic Texture */}
      <div className="absolute inset-0 z-0 opacity-5 pointer-events-none mix-blend-multiply">
        <Image src="/media/abstract_texture.png" alt="" fill className="object-cover" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <Reveal className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span data-reveal className="label text-green-2">
              Our Range
            </span>
            <h2 data-reveal className="display mt-3 max-w-2xl text-4xl text-navy sm:text-5xl">
              Floors, walls &amp; bathrooms —{" "}
              <em className="not-italic text-green-2">all under one roof</em>
            </h2>
            <p data-reveal className="mt-4 max-w-xl text-muted">
              Six departments, one showroom. Every product handpicked for Irish
              homes and Irish weather.
            </p>
          </div>
          {/* the numbers, tagged like samples on the showroom swatch board */}
          <div data-reveal className="shrink-0">
            <StatsStrip />
          </div>
        </Reveal>

        <Reveal className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3" stagger={0.1}>
          {collections.map((c) => (
            <Link
              key={c.id}
              href={`/collections#${c.id}`}
              data-reveal
              className="group overflow-hidden rounded-3xl border border-mist bg-white transition-all duration-500 hover:-translate-y-1.5 hover:border-green/50 hover:shadow-lift"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-t-3xl">
                <Parallax speed={0.2} className="relative -top-[12%] h-[125%]">
                  <Image
                    src={c.image}
                    alt={c.name}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                    className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                  />
                </Parallax>
              </div>
              <div className="p-8 relative">
                {/* Subtle glass effect behind text */}
                
                <div className="relative z-10 text-[0.66rem] font-bold tracking-[0.14em] text-green-2 uppercase">
                  {c.blurb}
                </div>
                <div className="relative z-10 mt-2 flex items-center justify-between gap-3">
                  <h3 className="font-display text-xl font-bold text-navy group-hover:text-green-2 transition-colors">{c.name}</h3>
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green/10 text-green transition-all duration-300 group-hover:bg-green group-hover:text-white"
                    aria-hidden="true"
                  >
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
                <p className="relative z-10 mt-3 text-sm leading-relaxed text-muted">{c.description}</p>
              </div>
            </Link>
          ))}
        </Reveal>
      </div>

      {/* Ambient glass glow circle */}
    </section>
  );
}
