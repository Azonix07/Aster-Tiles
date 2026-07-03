import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import fs from "fs";
import path from "path";

/**
 * POST /api/admin/upload
 *
 * Accepts a multipart form with:
 *   - file: the processed tile image (JPEG blob)
 *   - filename: suggested filename (e.g. "venus-bianco.jpg")
 *
 * Saves to public/media/tiles/ and returns the public path.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  let filename = String(formData.get("filename") ?? "tile.jpg").trim();

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10 MB)." }, { status: 400 });
  }

  // Sanitise filename
  filename = filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!filename.endsWith(".jpg") && !filename.endsWith(".jpeg") && !filename.endsWith(".png") && !filename.endsWith(".webp")) {
    filename += ".jpg";
  }

  // Ensure unique name if file exists
  const dir = path.join(process.cwd(), "public", "media", "tiles");
  fs.mkdirSync(dir, { recursive: true });

  let finalName = filename;
  let counter = 1;
  while (fs.existsSync(path.join(dir, finalName))) {
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    finalName = `${base}-${counter}${ext}`;
    counter++;
  }

  // Write file
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(dir, finalName), buffer);

  const publicPath = `/media/tiles/${finalName}`;
  return NextResponse.json({ ok: true, path: publicPath, filename: finalName });
}
