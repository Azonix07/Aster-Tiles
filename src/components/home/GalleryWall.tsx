import Image from "next/image";
import Reveal from "@/components/scroll/Reveal";
import Parallax from "@/components/scroll/Parallax";
import GridLines from "@/components/decor/GridLines";
import { getContent } from "@/lib/db";

/** Inspiration wall — real-home shots with gentle parallax drift. */
export default async function GalleryWall() {
  const { gallery } = await getContent();
  return (
    <section className="relative overflow-hidden py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative">
          <GridLines className="-top-16 h-64" />
          <Reveal className="relative text-center">
            <span data-reveal className="label text-green-2">
              Inspiration Gallery
            </span>
            <h2 data-reveal className="display mx-auto mt-3 max-w-2xl text-4xl text-navy sm:text-5xl">
              Beautiful spaces, <em className="not-italic text-green-2">real homes</em>
            </h2>
            <p data-reveal className="mx-auto mt-4 max-w-xl text-muted">
              How Aster tiles look in kitchens, bathrooms and gardens across
              Donegal and Ireland.
            </p>
          </Reveal>
        </div>

        <Reveal
          className="mt-14 grid auto-rows-[220px] grid-cols-2 gap-3 md:grid-cols-4 md:auto-rows-[240px]"
          stagger={0.07}
        >
          {gallery.map((g) => (
            <div
              key={g.id}
              data-reveal
              className={`group relative overflow-hidden rounded-xl border border-mist ${
                g.span === "wide"
                  ? "col-span-2"
                  : g.span === "tall"
                    ? "row-span-2"
                    : ""
              }`}
            >
              <Parallax speed={-0.3} className="absolute -inset-y-14 inset-x-0">
                <Image
                  src={g.image}
                  alt={g.tag}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </Parallax>
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-navy/50 via-transparent to-transparent p-4 opacity-80 transition-opacity duration-300 group-hover:opacity-100">
                <span className="rounded-sm bg-ink/85 px-2.5 py-1 font-display text-[0.68rem] font-bold tracking-wide text-white backdrop-blur-sm">
                  {g.tag}
                </span>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
