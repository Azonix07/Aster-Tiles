"use client";

import ScrubVideo from "@/components/scroll/ScrubVideo";
import Counter from "@/components/scroll/Counter";
import { useSite } from "@/components/StoreProvider";

/**
 * Act II — Inside the showroom. The camera glides down the main walkway
 * while the numbers that matter count themselves up.
 */
export default function ShowroomScene() {
  const site = useSite();
  return (
    <ScrubVideo
      src="/media/video/showroom-entry-scrub.mp4"
      poster="/media/video/showroom-entry-poster.jpg"
      pinHeight={240}
    >
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-ink/55 via-transparent to-ink/65" />

      {/* Chapter 1 — welcome to the floor */}
      <div
        data-window="0.04,0.4"
        className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center"
      >
        <p className="label text-green">Welcome to the Showroom</p>
        <h2 className="display mt-4 max-w-3xl text-4xl text-white sm:text-6xl">
          Every tile, at <em className="accent-italic text-green">true scale</em>,
          under real light
        </h2>
      </div>

      {/* Chapter 2 — the numbers */}
      <div
        data-window="0.5,0.95"
        className="absolute inset-0 z-20 flex items-end justify-center pb-28 px-6"
      >
        <div className="flex flex-wrap justify-center gap-12 border-t border-white/15 pt-9 sm:gap-20">
          {site.stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="display text-5xl text-white sm:text-6xl">
                <Counter value={s.value} suffix={s.suffix} />
              </div>
              <div className="mt-2 text-xs tracking-[0.18em] text-white/55 uppercase">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrubVideo>
  );
}
