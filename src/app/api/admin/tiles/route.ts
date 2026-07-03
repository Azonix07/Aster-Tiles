import { NextResponse } from "next/server";
import { mutateDb } from "@/lib/db";
import { sanitizeTile } from "@/lib/tileSanitize";
import { currentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!raw) return NextResponse.json({ error: "Bad request." }, { status: 400 });

  const tile = sanitizeTile(raw);
  if (typeof tile === "string") return NextResponse.json({ error: tile }, { status: 400 });

  const created = mutateDb((db) => {
    if (db.tiles.some((t) => t.id === tile.id)) return false;
    db.tiles.push(tile);
    return true;
  });

  if (!created) {
    return NextResponse.json({ error: "A tile with that id already exists." }, { status: 409 });
  }
  return NextResponse.json({ ok: true, id: tile.id });
}
