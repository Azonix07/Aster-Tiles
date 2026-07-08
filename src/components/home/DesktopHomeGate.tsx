"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(max-width: 1023px)"; // below Tailwind's lg breakpoint

function subscribe(cb: () => void): () => void {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/**
 * Renders the cinematic desktop homepage only on lg+ screens. CSS hides it
 * below lg for the first paint; after hydration the whole tree unmounts on
 * phones so the pinned scrub videos never download or run there.
 */
export default function DesktopHomeGate({ children }: { children: React.ReactNode }) {
  const isMobile = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false, // server renders the desktop tree (SEO, then swapped client-side)
  );
  if (isMobile) return null;
  return <div className="hidden lg:block">{children}</div>;
}
