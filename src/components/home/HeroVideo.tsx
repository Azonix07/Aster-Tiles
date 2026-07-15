"use client";

import { useEffect, useRef } from "react";

/**
 * The hero background video. The element is anchored to the top of the
 * frame and runs 112% of its height, so only the bottom ~11% of the
 * footage — where the generator watermark sits — is clipped by the
 * section's overflow-hidden. Plays slightly slowed for a calmer feel;
 * pauses for reduced-motion users (the poster stays as a still).
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
    const tryPlay = () => {
      v.play().catch(() => {});
    };
    // Some browsers block autoplay until a play() call after hydration.
    tryPlay();

    // Autoplay can also be refused outright — iOS Low Power Mode and Android's
    // data saver both do it, and no markup overrides that. A touch or click is a
    // user gesture, which lifts the block, so take the first one as our cue.
    const onGesture = () => tryPlay();
    document.addEventListener("touchstart", onGesture, { once: true, passive: true });
    document.addEventListener("click", onGesture, { once: true });
    // Coming back to a backgrounded tab leaves it paused; pick it up again.
    const onVisible = () => {
      if (!document.hidden) tryPlay();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("touchstart", onGesture);
      document.removeEventListener("click", onGesture);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <video
      ref={ref}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      // Without this, every moment the footage isn't playing — still buffering, or
      // autoplay refused outright — is a black hole where the hero should be.
      poster="/media/hero-video-poster.jpg"
      aria-hidden="true"
      className="absolute top-0 h-[112%] w-full object-cover object-top"
    >
      <source src="/media/hero-video.mp4" type="video/mp4" />
    </video>
  );
}
