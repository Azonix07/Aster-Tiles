import Image from "next/image";
import Parallax from "@/components/scroll/Parallax";
import Reveal, { RevealLines } from "@/components/scroll/Reveal";
import Rings from "@/components/decor/Rings";
import { getContent } from "@/lib/db";

/** Light opening: the story headline, then the showroom wide shot. */
export default async function AboutHero() {
  const { media } = await getContent();
  return (
    <section className="relative overflow-hidden border-b border-mist bg-white">
      <Rings id="about-rings" className="absolute -top-28 -right-28 h-96 w-96 opacity-15" />
      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-16 lg:pt-28">
        <Reveal className="flex flex-col items-center text-center">
          <span data-reveal className="label text-green-2">
            Our Story
          </span>
          <RevealLines
            as="h1"
            text={"Rooted in Donegal,\nserving all of Ireland"}
            className="display mt-5 max-w-4xl text-4xl text-navy sm:text-6xl lg:text-7xl"
          />
          <Reveal>
            <p data-reveal className="mt-6 max-w-xl text-muted">
              Fifteen years of tiles, floors and bathrooms — and one showroom on
              The Haw that started it all.
            </p>
          </Reveal>
        </Reveal>

        <Reveal>
          <div
            data-reveal
            className="relative mt-14 h-[46vh] min-h-[320px] overflow-hidden rounded-3xl border border-mist shadow-lift"
          >
            <Parallax speed={-0.1} className="absolute inset-0">
              <Image
                src={media.aboutHeroImage}
                alt="Inside the Aster Tiles showroom in Lifford, Co. Donegal"
                fill
                sizes="(min-width: 1280px) 1200px, 92vw"
                className="scale-110 object-cover"
                preload={true}
              />
            </Parallax>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
