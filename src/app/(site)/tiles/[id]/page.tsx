import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCart from "@/components/shop/AddToCart";
import Reveal from "@/components/scroll/Reveal";
import { getSettings, getTile, getTiles } from "@/lib/db";
import { money } from "@/lib/format";
import { currencyCode } from "@/lib/currency";
import { effectivePrice, hasDiscount } from "@/lib/pricing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const tile = getTile(id);
  if (!tile) return { title: "Tile not found" };
  const settings = getSettings();
  return {
    title: `${tile.name} — ${tile.material} tile, ${money(tile.pricePerSqm, settings.currencySymbol)}/m²`,
    description: tile.description,
    openGraph: {
      title: tile.name,
      description: tile.description,
      images: [{ url: tile.texture }],
    },
  };
}

export default async function TilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tile = getTile(id);
  if (!tile) notFound();

  const settings = getSettings();
  const related = getTiles()
    .filter((t) => t.id !== tile.id && t.category === tile.category)
    .slice(0, 4);

  const salePrice = effectivePrice(tile);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: tile.name,
    image: tile.texture,
    description: tile.description,
    material: tile.material,
    brand: { "@type": "Brand", name: "Aster Tiles" },
    offers: {
      "@type": "Offer",
      price: salePrice,
      priceCurrency: currencyCode(settings.currencySymbol),
      availability: tile.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      unitText: "per square metre",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="bg-off pt-12 pb-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* breadcrumbs */}
          <nav aria-label="Breadcrumb" className="text-xs text-muted">
            <Link href="/" className="hover:text-green">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/collections" className="hover:text-green">Collections</Link>
            <span className="mx-2">/</span>
            <span className="font-semibold text-navy">{tile.name}</span>
          </nav>

          <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
            {/* image */}
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-mist shadow-lift">
              <Image
                src={tile.texture}
                alt={`${tile.name} — ${tile.material}, ${tile.finish} finish`}
                fill
                priority
                sizes="(min-width: 1024px) 45vw, 92vw"
                className="object-cover"
              />
              <span className="absolute top-4 left-4 rounded-full bg-ink/65 px-3.5 py-1.5 font-display text-[0.65rem] font-bold tracking-[0.08em] text-white uppercase backdrop-blur-sm">
                {tile.finish}
              </span>
              {!tile.inStock && (
                <span className="absolute top-4 right-4 rounded-full bg-red-500/90 px-3.5 py-1.5 font-display text-[0.65rem] font-bold tracking-[0.08em] text-white uppercase">
                  Out of stock
                </span>
              )}
              {tile.inStock && hasDiscount(tile) && (
                <span className="absolute top-4 right-4 rounded-full bg-red-500 px-3.5 py-1.5 font-display text-[0.65rem] font-bold tracking-[0.08em] text-white uppercase">
                  {tile.discountPercent}% OFF
                </span>
              )}
            </div>

            {/* details */}
            <div>
              <p className="label text-green">{tile.material}</p>
              <h1 className="display mt-2 text-4xl text-navy sm:text-5xl">{tile.name}</h1>

              <p className="mt-5 flex items-baseline gap-2">
                {hasDiscount(tile) ? (
                  <>
                    <span className="font-display text-xl text-muted line-through">
                      {money(tile.pricePerSqm, settings.currencySymbol)}
                    </span>
                    <span className="font-display text-3xl font-bold text-red-500">
                      {money(salePrice, settings.currencySymbol)}
                    </span>
                  </>
                ) : (
                  <span className="font-display text-3xl font-bold text-navy">
                    {money(tile.pricePerSqm, settings.currencySymbol)}
                  </span>
                )}
                <span className="text-sm text-muted">per m²</span>
              </p>

              <p className="mt-5 max-w-xl leading-relaxed text-muted">{tile.description}</p>

              <dl className="mt-7 grid max-w-md grid-cols-2 gap-x-8 gap-y-3 rounded-xl border border-mist bg-white p-5 text-sm">
                <div>
                  <dt className="text-xs text-muted">Tile size</dt>
                  <dd className="mt-0.5 font-display font-bold text-navy">
                    {tile.widthMm} × {tile.heightMm} mm
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Material</dt>
                  <dd className="mt-0.5 font-display font-bold text-navy">{tile.material}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Finish</dt>
                  <dd className="mt-0.5 font-display font-bold text-navy">{tile.finish}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Availability</dt>
                  <dd className={`mt-0.5 font-display font-bold ${tile.inStock ? "text-green" : "text-red-500"}`}>
                    {tile.inStock ? "In stock" : "Out of stock"}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap gap-1.5">
                {tile.bestFor.map((b) => (
                  <span key={b} className="rounded-full border border-mist bg-white px-3 py-1 text-xs text-muted">
                    {b}
                  </span>
                ))}
              </div>

              <div className="mt-8">
                <AddToCart tileId={tile.id} pricePerSqm={salePrice} inStock={tile.inStock} />
              </div>

              <Link
                href="/visualizer"
                className="mt-6 inline-flex items-center gap-1.5 font-display text-sm font-bold text-green hover:text-green-2"
              >
                Preview this tile in your room →
              </Link>
            </div>
          </div>

          {/* related */}
          {related.length > 0 && (
            <div className="mt-20">
              <Reveal>
                <h2 data-reveal className="display text-2xl text-navy sm:text-3xl">
                  You might also like
                </h2>
              </Reveal>
              <div className="mt-8 grid grid-cols-2 gap-5 lg:grid-cols-4">
                {related.map((t) => (
                  <Link key={t.id} href={`/tiles/${t.id}`} className="group">
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-mist">
                      <Image
                        src={t.texture}
                        alt={t.name}
                        fill
                        sizes="(min-width: 1024px) 24vw, 46vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      />
                    </div>
                    <div className="mt-3 flex items-start justify-between gap-2">
                      <h3 className="font-display text-sm font-bold text-navy group-hover:text-green">
                        {t.name}
                      </h3>
                      <p className="shrink-0 font-display text-sm font-bold text-navy">
                        {money(t.pricePerSqm, settings.currencySymbol)}
                        <span className="block text-right text-[0.6rem] font-normal text-muted">/m²</span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
