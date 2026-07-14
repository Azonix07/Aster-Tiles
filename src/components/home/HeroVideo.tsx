"use client";

import { useEffect, useRef } from "react";

/**
 * The hero background video. The element is anchored to the top of the
 * frame and runs 112% of its height, so only the bottom ~11% of the
 * footage — where the generator watermark sits — is clipped by the
 * section's overflow-hidden. Plays slightly slowed for a calmer feel;
 * pauses for reduced-motion users (the first frame stays as a still).
 */
export default function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.pause();
      return;
    }
    v.playbackRate = 0.85;
    // Some browsers block autoplay until a play() call after hydration.
    v.play().catch(() => {});
  }, []);

  return (
    <video
      ref={ref}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
      className="absolute top-0 h-[112%] w-full object-cover object-top"
    >
      <source src="/media/hero-video.mp4" type="video/mp4" />
    </video>
  );
}
