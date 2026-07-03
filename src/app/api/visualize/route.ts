import { getTiles } from "@/lib/db";

export const maxDuration = 60;

const SURFACES = new Set(["floor", "walls", "both"]);

/**
 * POST /api/visualize — AI room redesign.
 * Multipart form: photo (File), tileId, surface (floor|walls|both), notes.
 * Proxies to the OpenAI Images Edit API (gpt-image-1) and returns a data URL.
 */
export async function POST(req: Request): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "AI mode needs an API key — add OPENAI_API_KEY (and optionally ANTHROPIC_API_KEY) to .env.local",
      },
      { status: 501 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const photo = form.get("photo");
  const tileId = form.get("tileId");
  const surfaceRaw = form.get("surface");
  const notes = form.get("notes");

  if (!(photo instanceof File) || photo.size === 0) {
    return Response.json({ error: "A room photo is required." }, { status: 400 });
  }
  if (photo.size > 20 * 1024 * 1024) {
    return Response.json({ error: "Photo too large — please use an image under 20MB." }, { status: 400 });
  }
  const tile = getTiles().find((t) => t.id === tileId);
  if (!tile) {
    return Response.json({ error: "Unknown tile." }, { status: 400 });
  }
  const surface =
    typeof surfaceRaw === "string" && SURFACES.has(surfaceRaw) ? surfaceRaw : "floor";
  const surfaceText =
    surface === "both" ? "floor and walls" : surface === "walls" ? "walls" : "floor";

  const styleNotes =
    typeof notes === "string" && notes.trim()
      ? ` Style notes from the customer: ${notes.trim().slice(0, 400)}.`
      : "";

  const prompt =
    `Redecorate this room: replace the ${surfaceText} with ${tile.name} tiles - ` +
    `${tile.description} (${tile.widthMm}x${tile.heightMm}mm, ${tile.finish} finish, ${tile.material}). ` +
    `Lay them at a realistic physical scale with neat grout lines. ` +
    `Keep the room's furniture, lighting, layout and everything else photorealistic and unchanged.` +
    styleNotes;

  const upstream = new FormData();
  upstream.append("model", "gpt-image-1");
  upstream.append("image[]", photo, photo.name || "room.png");
  upstream.append("prompt", prompt);
  upstream.append("size", "1024x1024");
  upstream.append("quality", "medium");

  try {
    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
    });

    const json = (await res.json().catch(() => null)) as {
      data?: { b64_json?: string }[];
      error?: { message?: string };
    } | null;

    if (!res.ok) {
      const message = json?.error?.message ?? `Image service responded with ${res.status}.`;
      console.error("[visualize] OpenAI error:", res.status, message);
      const status = res.status === 401 || res.status === 403 ? 502 : res.status >= 500 ? 502 : 422;
      return Response.json({ error: `AI redesign failed: ${message}` }, { status });
    }

    const b64 = json?.data?.[0]?.b64_json;
    if (!b64) {
      return Response.json(
        { error: "The image service returned no image. Please try again." },
        { status: 502 },
      );
    }
    return Response.json({ image: `data:image/png;base64,${b64}` });
  } catch (err) {
    console.error("[visualize] request failed:", err);
    return Response.json(
      { error: "Could not reach the image service. Please try again shortly." },
      { status: 502 },
    );
  }
}
