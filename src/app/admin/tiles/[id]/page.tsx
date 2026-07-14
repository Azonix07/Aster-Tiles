import Link from "next/link";
import { notFound } from "next/navigation";
import TileForm from "@/components/admin/TileForm";
import { getTile } from "@/lib/db";
import { requirePermission } from "@/lib/adminGuard";

export default async function EditTilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("tiles");
  const { id } = await params;
  const tile = await getTile(id);
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
