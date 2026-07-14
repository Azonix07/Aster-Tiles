import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/scroll/Reveal";
import Parallax from "@/components/scroll/Parallax";
import Tilt from "@/components/interactive/Tilt";
import { getSettings, getTiles } from "@/lib/db";
import { tileCategories, type TileCategory } from "@/lib/tiles";
import { money } from "@/lib/format";
import { effectivePrice, hasDiscount } from "@/lib/pricing";

/** One favourite from each style — a taste of the catalogue, linked to the shop. */
export default async function FeaturedTiles() {
  const tiles = await getTiles();
  const settings = await getSettings();

  const order: TileCategory[] = ["stone", "wood", "metro", "pattern"];
  const featured = order.flatMap((cat) => {
    const pick =
      tiles.find((t) => t.category === cat && t.inStock) ??
      tiles.find((t) => t.category === cat);
    return pick ? [pick] : [];
  });
  const label = (cat: TileCategory) =>
    tileCategories.find((c) => c.key === cat)?.label ?? cat;

  if (featured.length === 0) return null;

  return (
    <section className="relative overflow-hidden border-y border-mist/30 bg-white py-24 lg:py-32">
      {/* Background Graphic Texture */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-multiply">
        <Image src="/media/abstract_texture.png" alt="" fill className="object-cover" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <Reveal>
          <span data-reveal className="label text-green-2">
            Featured Tiles
          </span>
          <h2 data-reveal className="display mt-3 max-w-2xl text-4xl text-navy sm:text-5xl">
            One favourite from <em className="not-italic text-green-2">every style</em>
          </h2>
          <p data-reveal className="mt-4 max-w-xl text-muted">
            Stone, wood effect, metro and pattern — priced per square metre,
            ready to order online or see in the showroom.
          </p>
        </Reveal>

        <Reveal className="mt-16 grid grid-cols-2 gap-6 lg:grid-cols-4" stagger={0.1}>
          {featured.map((t, i) => (
            <Parallax key={t.id} speed={i % 2 === 0 ? 0.2 : 0.4} className="h-full">
              <Tilt className="h-full">
              <Link
                href={`/tiles/${t.id}`}
                data-reveal
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-mist/50 bg-white/60 backdrop-blur-md transition-all duration-500 hover:border-green/50 hover:shadow-[0_20px_40px_rgba(45,184,124,0.12)]"
              >
                <div className="relative aspect-square overflow-hidden bg-mist/30">
                  <Image
                    src={t.texture}
                    alt={t.name}
                    fill
                    sizes="(min-width: 1024px) 23vw, 46vw"
                    className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                  />
                  {/* shine sweep */}
                  <div className="pointer-events-none absolute inset-0 -translate-x-[130%] skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[130%]" />
                  {hasDiscount(t) && (
                    <span className="absolute top-4 right-4 rounded-full bg-red-500/90 backdrop-blur-sm px-3 py-1 font-display text-[0.62rem] font-bold tracking-[0.08em] text-white uppercase shadow-lg">
                      {t.discountPercent}% OFF
                    </span>
                  )}
                </div>
                <div className="relative flex flex-1 flex-col p-6">
                  {/* Subtle glass effect behind text */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
                  
                  <span className="relative z-10 text-[0.62rem] font-bold tracking-[0.16em] text-green-2 uppercase">
                    {label(t.category)}
                  </span>
                  <h3 className="relative z-10 mt-2 font-display text-lg font-bold text-navy group-hover:text-green-2 transition-colors">
                    {t.name}
                  </h3>
                  <p className="relative z-10 mt-1 text-xs text-muted font-medium">
                    {t.widthMm} × {t.heightMm} mm · {t.finish} · {t.material}
                  </p>
                  <p className="relative z-10 mt-auto flex items-baseline gap-2 pt-6">
                    {hasDiscount(t) ? (
                      <>
                        <span className="font-display text-2xl font-bold text-red-500">
                          {money(effectivePrice(t), settings.currencySymbol)}
                        </span>
                        <span className="text-xs text-muted line-through font-medium">
                          {money(t.pricePerSqm, settings.currencySymbol)}
                        </span>
                      </>
                    ) : (
                      <span className="font-display text-2xl font-bold text-navy group-hover:text-green-2 transition-colors">
                        {money(t.pricePerSqm, settings.currencySymbol)}
                      </span>
                    )}
                    <span className="text-xs text-muted font-medium">/ m²</span>
                  </p>
                </div>
              </Link>
              </Tilt>
            </Parallax>
          ))}
        </Reveal>

        <Reveal>
          <p data-reveal className="mt-16 text-center lg:text-left text-sm text-muted">
            All 500+ collections are on display in the Lifford showroom —{" "}
            <Link href="/collections" className="font-bold text-green-2 hover:text-green transition-colors border-b border-transparent hover:border-green">
              browse the full range →
            </Link>
          </p>
        </Reveal>
      </div>

      {/* Ambient glass glow circle */}
      <div className="absolute top-20 -right-20 w-80 h-80 rounded-full bg-green/5 blur-3xl pointer-events-none z-0" />
    </section>
  );
}
