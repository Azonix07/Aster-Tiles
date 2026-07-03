import Image from "next/image";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { money } from "@/lib/format";

export default function AdminTilesPage() {
  const db = getDb();
  const symbol = db.settings.currencySymbol;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="display text-3xl text-navy">Tiles</h1>
        <Link href="/admin/tiles/new" className="btn btn-green px-5 py-2.5 text-xs">
          + Add a tile
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-mist bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-140 text-left text-sm">
            <thead>
              <tr className="border-b border-mist text-[0.68rem] tracking-wide text-muted uppercase">
                <th className="py-2.5 pr-4 font-bold">Tile</th>
                <th className="py-2.5 pr-4 font-bold">Category</th>
                <th className="py-2.5 pr-4 font-bold">Size</th>
                <th className="py-2.5 pr-4 font-bold">Price / m²</th>
                <th className="py-2.5 pr-4 font-bold">Stock</th>
                <th className="py-2.5 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {db.tiles.map((t) => (
                <tr key={t.id} className="border-b border-mist/60 last:border-0">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-mist">
                        <Image src={t.texture} alt={t.name} fill sizes="44px" className="object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-navy">{t.name}</p>
                        <p className="text-xs text-muted">{t.material} · {t.finish}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-muted capitalize">{t.category}</td>
                  <td className="py-3 pr-4 text-muted">
                    {t.widthMm}×{t.heightMm}
                  </td>
                  <td className="py-3 pr-4 font-bold text-navy">{money(t.pricePerSqm, symbol)}</td>
                  <td className="py-3 pr-4">
                    {t.inStock ? (
                      <span className="font-bold text-green">In stock</span>
                    ) : (
                      <span className="font-bold text-red-500">Out</span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-3">
                      <Link href={`/admin/tiles/${t.id}`} className="text-xs font-bold text-green hover:text-green-2">
                        Edit
                      </Link>
                      <Link href={`/tiles/${t.id}`} className="text-xs font-bold text-muted hover:text-navy">
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
