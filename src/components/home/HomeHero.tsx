import Link from "next/link";
import Reveal from "@/components/scroll/Reveal";
import { Accent } from "@/components/Accent";
import { getContent } from "@/lib/db";
import HeroVideo from "@/components/home/HeroVideo";
import HeroFx from "@/components/home/HeroFx";
import MouseParallax from "@/components/interactive/MouseParallax";
import Rings from "@/components/decor/Rings";
import { LogoMark } from "@/components/Logo";

/** Immersive full-screen video hero: glass panel, depth layers, scroll choreography. */
export default function HomeHero() {
  const { site, home } = getContent();

  return (
    <section className="relative -mt-17 flex min-h-[100svh] w-full flex-col justify-center overflow-hidden">
      <HeroFx />

      {/* Background video — bottom of the footage stays clipped (watermark) */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-navy">
        <div data-hero-media className="absolute inset-0 will-change-transform">
          <HeroVideo />
        </div>
        {/* Overlays for contrast, noise, and theme */}
        <div className="absolute inset-0 bg-navy/50 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-navy/30" />
        <div className="noise-overlay" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-24 pb-16 sm:px-6 sm:pt-28 lg:pt-36 lg:pb-24">
        <Reveal>
          <MouseParallax factor={8} className="max-w-3xl">
            <div data-hero-panel className="glass-dark rounded-3xl p-6 shadow-lift will-change-transform sm:p-8 md:p-12">
              <span
                data-reveal
                className="flex items-center gap-3 text-[0.7rem] font-bold tracking-[0.24em] text-green uppercase"
              >
                <LogoMark className="h-4 w-auto" />
                {home.heroBadge}
              </span>

              <h1
                data-reveal
                className="display mt-5 text-4xl leading-[1.04] font-extrabold tracking-[-0.03em] text-white sm:text-6xl lg:text-7xl"
              >
                <Accent text={home.heroHeadline} />
              </h1>

              <p data-reveal className="mt-5 max-w-2xl text-base leading-relaxed text-mist sm:text-lg md:text-xl">
                {home.heroSub}
              </p>

              <div data-reveal className="mt-7 flex flex-wrap gap-3 sm:gap-4 md:mt-10">
                <Link href="/collections" className="btn btn-green">
                  Browse Collections
                </Link>
                <Link href="/visualizer" className="btn btn-outline hover:bg-white hover:text-navy">
                  Try the Room Visualizer
                </Link>
              </div>

              <p data-reveal className="mt-7 flex items-center gap-2.5 text-sm text-mist/80 md:mt-10">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="shrink-0 text-green" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {site.address.line1} · {site.address.line2}
              </p>
            </div>
          </MouseParallax>
        </Reveal>

        {/* Architectural rings — drifts opposite the panel for depth */}
        <div data-hero-rings className="absolute top-1/4 right-0 h-72 w-72 opacity-20 will-change-transform md:h-[28rem] md:w-[28rem] lg:right-10">
          <MouseParallax factor={-18} className="h-full w-full">
            <Rings id="hero-rings" className="h-full w-full" />
          </MouseParallax>
        </div>
      </div>

      {/* scroll cue — hidden on mobile where the tab bar sits over it */}
      <div data-hero-cue className="absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 lg:block motion-reduce:lg:hidden" aria-hidden="true">
        <div className="flex h-11 w-6.5 items-start justify-center rounded-full border border-white/30 p-1.5">
          <div className="h-2 w-1 animate-bounce rounded-full bg-green" />
        </div>
      </div>
    </section>
  );
}
