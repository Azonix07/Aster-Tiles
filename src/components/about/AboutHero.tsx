import Image from "next/image";
import Parallax from "@/components/scroll/Parallax";
import Reveal, { RevealLines } from "@/components/scroll/Reveal";

/** Full-bleed opening shot — the showroom, wide, with the story headline. */
export default function AboutHero() {
  return (
    <section className="vignette relative h-[70vh] min-h-[540px] overflow-hidden bg-ink">
      <Parallax speed={-0.18} className="absolute inset-0">
        <Image
          src="/media/stills/showroom-wide.jpg"
          alt="Inside the Aster Tiles showroom in Lifford, Co. Donegal"
          fill
          sizes="100vw"
          className="scale-110 object-cover"
          preload={true}
        />
      </Parallax>
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-ink/75 via-ink/30 to-ink/85" />

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center">
        <Reveal>
          <span data-reveal className="label text-green">
            Our Story
          </span>
        </Reveal>
        <RevealLines
          as="h1"
          text={"Rooted in Donegal,\nserving all of Ireland"}
          className="display mt-5 max-w-4xl text-4xl text-white sm:text-6xl lg:text-7xl"
        />
        <Reveal>
          <p data-reveal className="mt-6 max-w-xl text-white/70">
            Fifteen years of tiles, floors and bathrooms — and one showroom on
            The Haw that started it all.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
