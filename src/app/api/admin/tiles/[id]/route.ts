import { NextResponse } from "next/server";
import { mutateDb } from "@/lib/db";
import { sanitizeTile } from "@/lib/tileSanitize";
import { currentUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const { id } = await params;
  const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!raw) return NextResponse.json({ error: "Bad request." }, { status: 400 });

  const result = mutateDb((db): string | true => {
    const idx = db.tiles.findIndex((t) => t.id === id);
    if (idx === -1) return "Tile not found.";
    const tile = sanitizeTile(raw, db.tiles[idx]);
    if (typeof tile === "string") return tile;
    db.tiles[idx] = tile;
    return true;
  });

  if (result !== true) return NextResponse.json({ error: result }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const { id } = await params;
  mutateDb((db) => {
    db.tiles = db.tiles.filter((t) => t.id !== id);
  });
  return NextResponse.json({ ok: true });
}
