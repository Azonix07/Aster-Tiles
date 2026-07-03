"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "@/lib/gsap";
import { useStore } from "@/components/StoreProvider";

// pinned triggers must revert in a layout effect — see ScrubVideo.tsx
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * The Tile Room — a pinned horizontal rail. Vertical scroll travels
 * sideways through the six collections, each card easing upright in 3D
 * as it enters.
 */
export default function CollectionsRail() {
  const { collections } = useStore().content;
  const sectionRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const rail = railRef.current;
    if (!section || !rail) return;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const distance = () => rail.scrollWidth - window.innerWidth;

      const tween = gsap.to(rail, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      const cards = rail.querySelectorAll<HTMLElement>("[data-rail-card]");
      cards.forEach((card) => {
        gsap.fromTo(
          card,
          { rotateY: 14, scale: 0.92, opacity: 0.55 },
          {
            rotateY: 0,
            scale: 1,
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              containerAnimation: tween,
              start: "left 95%",
              end: "left 45%",
              scrub: true,
            },
          },
        );
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-navy">
      <div className="flex h-screen flex-col justify-center">
        <div className="mx-auto w-full max-w-7xl px-6 pb-8">
          <p className="label text-green">The Tile Room</p>
          <h2 className="display mt-3 text-4xl text-white sm:text-5xl">
            Walk the collections
          </h2>
        </div>

        <div
          ref={railRef}
          className="flex items-stretch gap-6 px-6 md:pl-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))]"
          style={{ perspective: "1200px" }}
        >
          {collections.map((c, i) => (
            <Link
              key={c.id}
              href={`/collections#${c.id}`}
              data-rail-card
              className="group relative block w-[78vw] shrink-0 overflow-hidden rounded-2xl sm:w-[52vw] md:w-[38vw] lg:w-[30vw]"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="relative aspect-[4/5] w-full md:aspect-[3/4]">
                <Image
                  src={c.image}
                  alt={c.name}
                  fill
                  sizes="(min-width: 1024px) 30vw, (min-width: 768px) 38vw, 78vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  preload={i === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6">
                  <div>
                    <div className="font-display text-2xl font-bold text-white">
                      {c.name}
                    </div>
                    <div className="mt-1 text-xs text-white/60">{c.blurb}</div>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green transition-transform duration-300 group-hover:rotate-45">
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <div className="absolute top-5 left-6 font-display text-[0.7rem] font-bold tracking-[0.22em] text-white/45">
                  {String(i + 1).padStart(2, "0")} / {String(collections.length).padStart(2, "0")}
                </div>
              </div>
            </Link>
          ))}

          {/* rail end card */}
          <Link
            href="/collections"
            data-rail-card
            className="group flex w-[60vw] shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-navy-2 sm:w-[40vw] md:w-[24vw]"
          >
            <div className="text-center">
              <div className="display text-3xl text-white">
                500+ <em className="accent-italic text-green">more</em>
              </div>
              <div className="mt-2 text-sm text-white/60">Browse all collections →</div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
