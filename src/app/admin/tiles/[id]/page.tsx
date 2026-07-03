import Link from "next/link";
import { notFound } from "next/navigation";
import TileForm from "@/components/admin/TileForm";
import { getTile } from "@/lib/db";

export default async function EditTilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tile = getTile(id);
  if (!tile) notFound();

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/tiles" className="text-xs font-bold text-muted hover:text-green">
        ← All tiles
      </Link>
      <h1 className="display mt-2 text-3xl text-navy">Edit — {tile.name}</h1>
      <div className="mt-6">
        <TileForm tile={tile} />
      </div>
    </div>
  );
}
