import Anthropic from "@anthropic-ai/sdk";
import { getTiles, type DbTile } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export const maxDuration = 60;

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

const IMAGE_TYPES: ReadonlySet<string> = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const suggestionSchema = (tiles: DbTile[]) => ({
  type: "object",
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          tileId: {
            type: "string",
            enum: tiles.map((t) => t.id),
            description: "The id of the recommended tile from the Aster catalogue.",
          },
          reason: {
            type: "string",
            description:
              "One or two customer-friendly sentences on why this tile suits this specific room.",
          },
          surface: {
            type: "string",
            enum: ["floor", "wall"],
            description: "Where in this room the tile should go.",
          },
        },
        required: ["tileId", "reason", "surface"],
        additionalProperties: false,
      },
    },
  },
  required: ["suggestions"],
  additionalProperties: false,
});

/**
 * POST /api/suggest — Claude looks at the room photo and picks the 3 tiles
 * from our catalogue best suited to it, with reasoning.
 */
export async function POST(req: Request): Promise<Response> {
  if (!(await currentUser())) {
    return Response.json({ error: "Sign in to use AI suggestions." }, { status: 401 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
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
  if (!(photo instanceof File) || photo.size === 0) {
    return Response.json({ error: "A room photo is required." }, { status: 400 });
  }
  if (!IMAGE_TYPES.has(photo.type)) {
    return Response.json(
      { error: "Unsupported image format — please upload a JPG, PNG, GIF or WebP." },
      { status: 400 },
    );
  }
  if (photo.size > 8 * 1024 * 1024) {
    return Response.json(
      { error: "Photo too large — please use an image under 8MB." },
      { status: 400 },
    );
  }

  const data = Buffer.from(await photo.arrayBuffer()).toString("base64");
  const mediaType = photo.type as ImageMediaType;

  const tiles = getTiles();
  const catalogue = tiles
    .map(
      (t) =>
        `- id: ${t.id} | ${t.name} | category: ${t.category} | ${t.widthMm}x${t.heightMm}mm | ` +
        `${t.finish} ${t.material} | best for: ${t.bestFor.join(", ")} | ${t.description}`,
    )
    .join("\n");

  const promptText =
    `You are the resident tile consultant at Aster Tiles, a premium tile showroom in ` +
    `Lifford, Co. Donegal, Ireland. A customer has shared this photo of their room.\n\n` +
    `Here is our tile catalogue:\n${catalogue}\n\n` +
    `Study the room's function, light, colour palette and existing materials, then pick ` +
    `the 3 best-suited tiles from the catalogue (exactly 3, all with distinct ids). For ` +
    `each, say which surface it belongs on in this room and explain why it works — warm, ` +
    `concrete and specific to what you can see in the photo.`;

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2000,
      output_config: {
        format: {
          type: "json_schema",
          schema: suggestionSchema(tiles),
        },
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data },
            },
            { type: "text", text: promptText },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return Response.json(
        { error: "The AI declined to analyse this photo. Please try a different image." },
        { status: 502 },
      );
    }

    const textBlock = response.content.find(
      (b): b is Extract<(typeof response.content)[number], { type: "text" }> =>
        b.type === "text",
    );
    if (!textBlock) {
      return Response.json(
        { error: "The AI returned no suggestions. Please try again." },
        { status: 502 },
      );
    }

    const parsed = JSON.parse(textBlock.text) as {
      suggestions: { tileId: string; reason: string; surface: "floor" | "wall" }[];
    };
    return Response.json({ suggestions: parsed.suggestions.slice(0, 3) });
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.error("[suggest] Anthropic error:", err.status, err.message);
      return Response.json(
        { error: "The suggestion service had a problem. Please try again shortly." },
        { status: 502 },
      );
    }
    console.error("[suggest] failed:", err);
    return Response.json(
      { error: "Couldn't analyse the photo. Please try again." },
      { status: 502 },
    );
  }
}
