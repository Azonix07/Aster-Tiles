import Link from "next/link";
import TileForm from "@/components/admin/TileForm";

export default function NewTilePage() {
  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/tiles" className="text-xs font-bold text-muted hover:text-green">
        ← All tiles
      </Link>
      <h1 className="display mt-2 text-3xl text-navy">Add a tile</h1>
      <div className="mt-6">
        <TileForm />
      </div>
    </div>
  );
}
