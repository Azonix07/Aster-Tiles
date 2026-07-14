"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/scroll/Reveal";
import Parallax from "@/components/scroll/Parallax";
import Rings from "@/components/decor/Rings";
import { useStore, useTiles } from "@/components/StoreProvider";

const featured = ["venus-bianco", "torano-gold", "heritage-oak", "laurent-black", "moroccan-star"];

/**
 * A taste of the visualizer: pick a swatch, the room's floor strip
 * repaints live. The real tool is one click away.
 */
export default function VisualizerTeaser() {
  const tiles = useTiles();
  const { media } = useStore().content;
  const preferred = tiles.filter((t) => featured.includes(t.id));
  const options = preferred.length > 0 ? preferred : tiles.slice(0, 5);
  const [active, setActive] = useState(options[0]);

  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <Rings id="viz-rings" className="absolute -left-40 top-10 h-96 w-96 opacity-10" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2">
        <Reveal>
          <span data-reveal className="label text-green-2">
            AI-Powered Tool
          </span>
          <h2 data-reveal className="display mt-3 text-4xl text-navy sm:text-5xl">
            See it <em className="not-italic text-green-2">before</em>
            <br />
            you buy it
          </h2>
          <p data-reveal className="mt-5 max-w-md text-muted">
            Design a room from scratch, overlay tiles onto a photo of your own
            home, or let our AI re-imagine your space — complete with a tile
            count and an order quantity.
          </p>
          <ul data-reveal className="mt-7 space-y-3 text-sm text-body">
            {[
              "Perspective room preview at true tile scale",
              "Upload your room photo — mask walls or floors",
              "AI re-decoration with any tile in our range",
              "Instant coverage calculator with 10% waste buffer",
            ].map((f) => (
              <li key={f} className="flex items-center gap-3">
                <span className="h-2 w-2 shrink-0 rounded-full bg-green" />
                {f}
              </li>
            ))}
          </ul>
          <div data-reveal className="mt-9">
            <Link href="/visualizer" className="btn btn-green">
              Open the Room Visualizer
            </Link>
          </div>
        </Reveal>

        <Reveal>
          <div data-reveal className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-mist shadow-lift">
              <Parallax speed={-0.12} className="absolute inset-x-0 -inset-y-[12%]">
                <Image
                  src={media.visualizerTeaserImage}
                  alt="Room preview"
                  fill
                  sizes="(min-width: 1024px) 45vw, 90vw"
                  className="object-cover"
                />
              </Parallax>
              {/* floor repaint strip */}
              <div
                className="absolute inset-x-0 bottom-0 h-2/5"
                style={{
                  WebkitMaskImage: "linear-gradient(to top, black 55%, transparent)",
                  maskImage: "linear-gradient(to top, black 55%, transparent)",
                }}
              >
                <div
                  className="h-full w-full opacity-85 transition-all duration-500"
                  style={{
                    backgroundImage: `url(${active.texture})`,
                    backgroundSize: "23% auto",
                    transform: "perspective(600px) rotateX(58deg) scale(1.7)",
                    transformOrigin: "bottom center",
                  }}
                />
              </div>
              <div className="glass-dark absolute top-4 left-4 rounded-full px-3.5 py-1.5 font-display text-[0.68rem] font-bold tracking-wide text-white">
                Previewing · {active.name}
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              {options.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActive(t)}
                  aria-label={`Preview ${t.name}`}
                  aria-pressed={active.id === t.id}
                  className={`relative h-14 w-14 overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                    active.id === t.id
                      ? "scale-110 border-green shadow-[0_0_0_3px_rgba(45,184,124,0.25)]"
                      : "border-mist hover:border-green/60"
                  }`}
                >
                  <Image src={t.texture} alt={t.name} fill sizes="56px" className="object-cover" />
                </button>
              ))}
              <span className="ml-2 hidden text-xs text-muted sm:block">
                Tap a tile — try it live
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
