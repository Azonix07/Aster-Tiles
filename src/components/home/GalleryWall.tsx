import Image from "next/image";
import Reveal from "@/components/scroll/Reveal";
import Parallax from "@/components/scroll/Parallax";
import { getContent } from "@/lib/db";

/** Inspiration wall — real-home shots with gentle parallax drift. */
export default function GalleryWall() {
  const { gallery } = getContent();
  return (
    <section className="bg-navy py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="text-center">
          <span data-reveal className="label text-green">
            Inspiration Gallery
          </span>
          <h2 data-reveal className="display mx-auto mt-3 max-w-2xl text-4xl text-white sm:text-5xl">
            Beautiful spaces, <em className="accent-italic text-green">real homes</em>
          </h2>
          <p data-reveal className="mx-auto mt-4 max-w-xl text-white/60">
            How Aster tiles look in kitchens, bathrooms and gardens across
            Donegal and Ireland.
          </p>
        </Reveal>

        <Reveal
          className="mt-14 grid auto-rows-[220px] grid-cols-2 gap-3 md:grid-cols-4 md:auto-rows-[240px]"
          stagger={0.07}
        >
          {gallery.map((g) => (
            <div
              key={g.id}
              data-reveal
              className={`group relative overflow-hidden rounded-xl ${
                g.span === "wide"
                  ? "col-span-2"
                  : g.span === "tall"
                    ? "row-span-2"
                    : ""
              }`}
            >
              <Parallax speed={-0.35} className="absolute -inset-y-6 inset-x-0">
                <Image
                  src={g.image}
                  alt={g.tag}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </Parallax>
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/70 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="rounded-full bg-green px-3 py-1 font-display text-[0.68rem] font-bold tracking-wide text-white">
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
