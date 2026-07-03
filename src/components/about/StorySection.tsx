import Image from "next/image";
import Counter from "@/components/scroll/Counter";
import Parallax from "@/components/scroll/Parallax";
import Reveal from "@/components/scroll/Reveal";
import { getContent } from "@/lib/db";

const promises = [
  "500+ tile collections under one roof",
  "Free nationwide delivery, carefully packed",
  "A full bathroom design service, end to end",
];

/** The founding story — words on the left, the shopfront on the right. */
export default function StorySection() {
  const { media } = getContent();
  return (
    <section className="bg-off py-24 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <span data-reveal className="label text-green">
            How It Started
          </span>
          <h2 data-reveal className="display mt-3 text-4xl text-navy sm:text-5xl">
            One belief — everyone deserves{" "}
            <em className="accent-italic text-green">a beautiful home</em>
          </h2>
          <p data-reveal className="mt-6 leading-relaxed text-muted">
            Aster Tiles opened its doors more than fifteen years ago on The
            Haw in Lifford, Co. Donegal, with a single belief: everyone
            deserves a beautiful home. What began as a small local tile shop
            has grown into one of the northwest&apos;s best-loved showrooms
            for tiles, wooden floors and bathrooms.
          </p>
          <p data-reveal className="mt-4 leading-relaxed text-muted">
            Since then, thousands of Irish homeowners, architects and
            contractors have trusted us with their floors, walls and
            bathrooms — from single-room refreshes to full new builds. The
            belief hasn&apos;t changed. Neither has the welcome.
          </p>
          <ul data-reveal className="mt-7 space-y-3 text-sm font-medium text-body">
            {promises.map((p) => (
              <li key={p} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green/12 text-green">
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {p}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal>
          <div data-reveal className="relative">
            <div className="relative overflow-hidden rounded-3xl shadow-lift">
              <div className="relative aspect-[4/5] sm:aspect-[4/4]">
                <Parallax speed={-0.12} className="absolute inset-0">
                  <Image
                    src={media.aboutStoryImage}
                    alt="The Aster Tiles showroom exterior on The Haw, Lifford"
                    fill
                    sizes="(min-width: 1024px) 45vw, 90vw"
                    className="scale-110 object-cover"
                  />
                </Parallax>
              </div>
            </div>

            {/* floating badge */}
            <div className="absolute -bottom-7 left-6 rounded-2xl bg-green px-7 py-5 text-white shadow-green">
              <div className="display text-3xl sm:text-4xl">
                <Counter value={15} suffix="+" />
              </div>
              <div className="mt-1 font-display text-[0.7rem] font-bold tracking-[0.18em] uppercase text-white/85">
                Years in Tiles
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
