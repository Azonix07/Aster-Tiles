import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { mutateDb } from "@/lib/db";
import { sanitizeTile } from "@/lib/tileSanitize";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/roles";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!can(user, "tiles")) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!raw) return NextResponse.json({ error: "Bad request." }, { status: 400 });

  const tile = sanitizeTile(raw);
  if (typeof tile === "string") return NextResponse.json({ error: tile }, { status: 400 });

  const created = await mutateDb((db) => {
    if (db.tiles.some((t) => t.id === tile.id)) return false;
    db.tiles.push(tile);
    return true;
  });

  if (!created) {
    return NextResponse.json({ error: "A tile with that id already exists." }, { status: 409 });
  }
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, id: tile.id });
}
