import Link from "next/link";
import Reveal from "@/components/scroll/Reveal";
import { Accent } from "@/components/Accent";
import { getContent } from "@/lib/db";
import HeroVideo from "@/components/home/HeroVideo";
import HeroFx from "@/components/home/HeroFx";

/** Full-bleed video hero — minimal, centred, no backing card (Manychat-style). */
export default async function HomeHero() {
  const { home } = await getContent();

  return (
    <section className="relative -mt-17 flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden">
      <HeroFx />

      {/* Background video — bottom of the footage stays clipped (watermark) */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-ink">
        <div data-hero-media className="absolute inset-0 will-change-transform">
          <HeroVideo />
        </div>
        {/* Legibility scrim: darker top (for the transparent nav) + bottom (scroll cue),
            lighter middle so the footage breathes. */}
        <div className="absolute inset-0 bg-ink/35" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/20 to-ink/75" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-4xl px-6 text-center">
        <Reveal>
          <div data-hero-content>
            <span
              data-reveal
              className="text-[0.7rem] font-bold tracking-[0.22em] text-white/80 uppercase [text-shadow:0_1px_10px_rgba(0,0,0,0.35)]"
            >
              {home.heroBadge}
            </span>

            <h1
              data-reveal
              className="display mx-auto mt-6 max-w-4xl text-5xl leading-[0.95] tracking-[-0.04em] text-white sm:text-7xl lg:text-8xl [text-shadow:0_2px_30px_rgba(0,0,0,0.3)]"
            >
              <Accent text={home.heroHeadline} />
            </h1>

            <p
              data-reveal
              className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg"
            >
              {home.heroSub}
            </p>

            <div data-reveal className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href="/collections" className="btn btn-green">
                Browse Collections
              </Link>
              <Link href="/visualizer" className="btn btn-outline hover:bg-white hover:text-ink">
                Try the Room Visualizer
              </Link>
            </div>
          </div>
        </Reveal>
      </div>

      {/* scroll cue — hidden on mobile where the tab bar sits over it */}
      <div
        data-hero-cue
        className="absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 lg:block motion-reduce:lg:hidden"
        aria-hidden="true"
      >
        <div className="flex h-11 w-6.5 items-start justify-center rounded-full border border-white/30 p-1.5">
          <div className="h-2 w-1 animate-bounce rounded-full bg-green" />
        </div>
      </div>
    </section>
  );
}
