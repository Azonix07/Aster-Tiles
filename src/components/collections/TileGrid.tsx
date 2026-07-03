"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "@/lib/gsap";
import Reveal from "@/components/scroll/Reveal";
import { tileCategories, type TileCategory } from "@/lib/tiles";
import { useSettings, useTiles } from "@/components/StoreProvider";
import { money } from "@/lib/format";

type FilterKey = TileCategory | "all";

/**
 * "Shop the range" — filterable grid of every tile in the catalogue.
 * First appearance stagger-reveals on scroll; subsequent filter changes
 * re-stagger the surviving cards immediately.
 */
export default function TileGrid() {
  const tiles = useTiles();
  const settings = useSettings();
  const [filter, setFilter] = useState<FilterKey>("all");
  const gridRef = useRef<HTMLDivElement>(null);
  const revealed = useRef(false);

  const visible =
    filter === "all" ? tiles : tiles.filter((t) => t.category === filter);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const cards = grid.querySelectorAll<HTMLElement>("[data-tile-card]");
    if (!cards.length) return;

    const ctx = gsap.context(() => {
      if (!revealed.current) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 44 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "expo.out",
            stagger: 0.06,
            scrollTrigger: {
              trigger: grid,
              start: "top 82%",
              once: true,
              onEnter: () => {
                revealed.current = true;
              },
            },
          },
        );
      } else {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 22 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: "expo.out",
            stagger: 0.045,
            overwrite: "auto",
          },
        );
      }
    }, grid);
    return () => ctx.revert();
  }, [filter]);

  return (
    <div>
      {/* filter chips */}
      <Reveal>
        <div data-reveal className="flex flex-wrap items-center gap-2.5">
          {tileCategories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setFilter(cat.key)}
              aria-pressed={filter === cat.key}
              className={`cursor-pointer rounded-full border px-4 py-2 font-display text-xs font-bold tracking-[0.06em] transition-colors duration-200 ${
                filter === cat.key
                  ? "border-green bg-green text-white"
                  : "border-mist bg-white text-muted hover:border-green hover:text-green"
              }`}
            >
              {cat.label}
            </button>
          ))}
          <span className="ml-1 text-xs text-muted/80">
            {visible.length} of {tiles.length} tiles
          </span>
        </div>
      </Reveal>

      {/* grid */}
      <div
        ref={gridRef}
        className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-3 lg:grid-cols-4"
      >
        {visible.map((t) => (
          <article
            key={t.id}
            data-tile-card
            className="group flex flex-col opacity-0"
          >
            <Link href={`/tiles/${t.id}`} className="relative block aspect-square overflow-hidden rounded-xl bg-mist">
              <Image
                src={t.texture}
                alt={t.name}
                fill
                sizes="(min-width: 1024px) 24vw, (min-width: 640px) 31vw, 46vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              {/* shine sweep */}
              <div className="pointer-events-none absolute inset-0 -translate-x-[130%] skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[130%]" />
              <span className="absolute top-3 left-3 rounded-full bg-ink/65 px-3 py-1 font-display text-[0.62rem] font-bold tracking-[0.08em] text-white uppercase backdrop-blur-sm">
                {t.finish}
              </span>
              {!t.inStock && (
                <span className="absolute top-3 right-3 rounded-full bg-red-500/90 px-3 py-1 font-display text-[0.62rem] font-bold tracking-[0.08em] text-white uppercase">
                  Out of stock
                </span>
              )}
            </Link>

            <div className="mt-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg leading-snug font-bold text-navy">
                  <Link href={`/tiles/${t.id}`} className="hover:text-green">
                    {t.name}
                  </Link>
                </h3>
                <p className="mt-1 text-xs text-muted">
                  {t.material} · {t.widthMm} × {t.heightMm} mm
                </p>
              </div>
              <p className="shrink-0 text-right">
                <span className="font-display text-lg font-bold text-navy">
                  {money(t.pricePerSqm, settings.currencySymbol)}
                </span>
                <span className="block text-[0.65rem] text-muted">per m²</span>
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {t.bestFor.map((b) => (
                <span
                  key={b}
                  className="rounded-full border border-mist px-2.5 py-0.5 text-[0.65rem] text-muted"
                >
                  {b}
                </span>
              ))}
            </div>

            <Link
              href={`/tiles/${t.id}`}
              className="mt-4 inline-flex items-center gap-1.5 font-display text-sm font-bold text-green transition-colors hover:text-green-2"
            >
              View &amp; buy
              <svg
                width="13"
                height="13"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 12h14M12 5l7 7-7 7"
                />
              </svg>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
