import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import fs from "fs";
import path from "path";

/**
 * POST /api/admin/upload
 *
 * Accepts a multipart form with:
 *   - file: an image (any folder) or an mp4/webm video (video folder only)
 *   - filename: suggested filename (e.g. "venus-bianco.jpg")
 *   - folder: which public/media/ subfolder to save into (default "tiles")
 *
 * Returns the public path of the stored file.
 */

const FOLDERS = ["tiles", "video", "stills", "gallery", "categories", "staff"] as const;

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const VIDEO_EXTENSIONS = [".mp4", ".webm"];

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200 MB

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
  let filename = String(formData.get("filename") ?? "upload").trim();
  const folder = String(formData.get("folder") ?? "tiles");

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (!FOLDERS.includes(folder as (typeof FOLDERS)[number])) {
    return NextResponse.json({ error: "Unknown media folder." }, { status: 400 });
  }

  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");

  if (isVideo) {
    if (folder !== "video") {
      return NextResponse.json(
        { error: "Videos can only be uploaded to the video folder." },
        { status: 400 },
      );
    }
    if (!["video/mp4", "video/webm"].includes(file.type)) {
      return NextResponse.json({ error: "Only MP4 or WebM videos are allowed." }, { status: 400 });
    }
    if (file.size > MAX_VIDEO_BYTES) {
      return NextResponse.json({ error: "Video too large (max 200 MB)." }, { status: 400 });
    }
  } else if (isImage) {
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image too large (max 10 MB)." }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: "Only image or video files are allowed." }, { status: 400 });
  }

  // Sanitise filename
  filename = filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const allowedExts = isVideo ? VIDEO_EXTENSIONS : IMAGE_EXTENSIONS;
  if (!allowedExts.some((ext) => filename.endsWith(ext))) {
    filename += isVideo ? (file.type === "video/webm" ? ".webm" : ".mp4") : ".jpg";
  }

  // Ensure unique name if file exists
  const dir = path.join(process.cwd(), "public", "media", folder);
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

  const publicPath = `/media/${folder}/${finalName}`;
  return NextResponse.json({ ok: true, path: publicPath, filename: finalName });
}
