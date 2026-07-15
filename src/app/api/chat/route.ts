import Anthropic from "@anthropic-ai/sdk";
import { getContent, getSettings, getTiles, type DbTile, type Settings, type SiteContent } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { effectivePrice, hasDiscount } from "@/lib/pricing";
import { money } from "@/lib/format";

export const maxDuration = 60;

const KEY_NOTICE =
  "The showroom assistant needs an API key — add ANTHROPIC_API_KEY to .env.local";

/** Pages the assistant may point a visitor at. Enum-pinned so it cannot invent a URL. */
const LINKS: Record<string, string> = {
  "/": "Home",
  "/collections": "Browse the collections",
  "/visualizer": "Try the Room Visualizer",
  "/about": "About Aster Tiles",
  "/contact": "Contact us",
  "/track": "Track your order",
  "/cart": "View your basket",
  "/account/support": "Your support enquiries",
  "/login": "Sign in",
  "/register": "Create an account",
};

/** Conversation turns we accept from the client, and how much of each we keep. */
const MAX_HISTORY = 10;
const MAX_MESSAGE_CHARS = 2000;

/**
 * This route is public — the whole point of the assistant is to greet visitors who
 * have not signed in — so it is the one endpoint where an anonymous caller reaches a
 * paid model. Cap each IP to keep that from being free compute for someone else.
 * In-memory, so on a serverless host the ceiling is per-instance rather than global;
 * it bounds abuse from any one caller without a new datastore.
 */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 12;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  // Drop idle callers so the map can't grow without bound on a long-lived instance.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(key);
    }
  }
  return recent.length > RATE_MAX;
}

type ChatRole = "user" | "assistant";

interface ChatTurn {
  role: ChatRole;
  body: string;
}

const replySchema = (tiles: DbTile[]) => ({
  type: "object",
  properties: {
    reply: {
      type: "string",
      description:
        "Your answer to the visitor, as plain conversational text. No markdown, no links, no bullet characters.",
    },
    tileIds: {
      type: "array",
      description:
        "Up to 3 tile ids from the catalogue to show the visitor as cards, when tiles are what they asked about. Empty when no tile is relevant.",
      items: { type: "string", enum: tiles.map((t) => t.id) },
    },
    href: {
      type: "string",
      enum: ["", ...Object.keys(LINKS)],
      description:
        "One page to offer as a button, when a page would genuinely help. Empty string when none fits.",
    },
  },
  required: ["reply", "tileIds", "href"],
  additionalProperties: false,
});

/** Everything the assistant is allowed to know, serialized from the live store. */
function buildSystemPrompt(
  content: SiteContent,
  tiles: DbTile[],
  settings: Settings,
  signedIn: boolean,
  path: string,
): string {
  const { site, staff, collections } = content;

  const catalogue = tiles
    .map((t) => {
      const price = money(effectivePrice(t), settings.currencySymbol);
      const wasPrice = hasDiscount(t)
        ? ` (was ${money(t.pricePerSqm, settings.currencySymbol)})`
        : "";
      const bestFor = t.bestFor.length ? t.bestFor.join(", ") : "no specific rooms listed";
      return (
        `- id: ${t.id} | ${t.name} | category: ${t.category} | ${t.widthMm}x${t.heightMm}mm | ` +
        `${t.finish} ${t.material} | ${price}/m²${wasPrice} | ` +
        `${t.inStock ? "in stock" : "out of stock"} | best for: ${bestFor} | ${t.description}`
      );
    })
    .join("\n");

  const hours = site.hours.map((h) => `${h.days}: ${h.time}`).join(" · ");
  const collectionList = collections.map((c) => `${c.name} — ${c.blurb}`).join("\n");
  const team = staff.map((s) => `${s.name}, ${s.role} — ${s.bio}`).join("\n");

  const delivery =
    settings.freeDeliveryOver > 0
      ? `Delivery is ${money(settings.deliveryFee, settings.currencySymbol)}, and free once the order subtotal reaches ${money(settings.freeDeliveryOver, settings.currencySymbol)}.`
      : `Delivery is ${money(settings.deliveryFee, settings.currencySymbol)} on every order.`;

  const payment = [
    settings.codEnabled ? "cash on delivery" : null,
    settings.razorpayEnabled ? "card payment at checkout" : null,
  ]
    .filter(Boolean)
    .join(" and ");

  return `You are the resident tile consultant at ${site.name}, a premium tile showroom in Lifford, Co. Donegal, Ireland. You are talking to a visitor through a small chat widget on the website. They are currently on the page ${path}.

## Voice
Warm, concise and practical — the way a knowledgeable person on the showroom floor talks, not a brochure. Irish/British English (colour, favourite, catalogue, analyse). Two or three short sentences is almost always enough; never go past about 90 words. Ask one question back when it would genuinely narrow things down (room, size, look), not as a reflex.

The "reply" field renders as plain text: no markdown, no asterisks, no bullet characters, no URLs. To send someone to a page, set "href". To show tiles, set "tileIds" — the visitor sees them as real cards with photos and prices, so name them in the reply rather than listing their specs.

## The business
${site.name} — ${site.tagline}. ${site.description}
Showroom: ${site.address.line1}, ${site.address.line2}.
Phone: ${site.phone}. Email: ${site.email}.
Opening hours: ${hours}
${site.stats.map((s) => `${s.value}${s.suffix} ${s.label}`).join(" · ")}

## The team
${team}

## Ordering
${delivery}
Payment: ${payment}.
Prices are per square metre. The tile page has a calculator for how many square metres a room needs.
${settings.maintenance.payments ? "IMPORTANT: ordering is paused right now for maintenance. Visitors can still browse everything, but tell them checkout is temporarily unavailable and suggest phoning the showroom." : ""}

## The tile catalogue (every tile we sell — there are no others)
${catalogue}

## Collections (marketing groupings shown on /collections)
${collectionList}
These are display groupings only. You cannot tell which catalogue tiles belong to which collection, so never claim a tile is part of a named collection.

## The website
/ — home
/collections — every tile, filterable
/visualizer — the Room Visualizer: upload a room photo and see it re-tiled by AI, or design in 3D. Signing in unlocks the AI redesign and the 360° room.
/about — the story, the showroom and the team
/contact — phone, email, map and an enquiry form
/track — check an order's progress using the order number and the email that placed it. No sign-in needed.
/cart — the basket
/account/support — support enquiries (sign-in needed)
The visitor is ${signedIn ? "signed in" : "not signed in"}.

## Rules you must not break
1. Only state facts given above. If you do not know something, say so plainly and offer the phone number or email. Never guess, never fill a gap with something plausible.
2. We have no published returns, refunds, exchanges, warranty, cancellation or trade-account policy, and no lead times or delivery timescales. If asked, say you would not want to quote it wrong and point them to the showroom on ${site.phone} or ${site.email}. Do not improvise one, and do not reason aloud about what it is "likely" to be.
3. Delivery: never say delivery is free without the ${money(settings.freeDeliveryOver, settings.currencySymbol)} threshold. Elsewhere the site advertises "free nationwide delivery" as a slogan — the rule above is the real one.
4. Never invent a tile, price, size, finish, stock level or discount. Every tile is in the catalogue above; if we do not stock what they want, say so and suggest the nearest thing we do stock.
5. You cannot look up orders, accounts or enquiries, and you cannot see what is in their basket. For an order, send them to /track — they will need the order number and the email used. Never ask them for an order number or email in the chat.
6. Never ask for card details, passwords, PPS numbers or a full address. If a visitor volunteers any, do not repeat it back.
7. ${signedIn ? "For anything needing a person, they can raise an enquiry at /account/support, or phone the showroom." : "For anything needing a person, point them to /contact, or the phone number above. They cannot raise a support enquiry without signing in."}
8. You represent Aster Tiles. Politely decline anything off-topic and steer back to tiles, floors, bathrooms or the showroom.`;
}

/**
 * POST /api/chat — the showroom assistant.
 * JSON body: { message, history?, path? }. Public by design (visitors are greeted before
 * they sign in), so it is rate limited per IP. Every fact comes from the live store —
 * catalogue context is never accepted from the client.
 */
export async function POST(req: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: KEY_NOTICE }, { status: 501 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) {
    return Response.json(
      { error: "That's a lot of questions at once — give me a moment and try again." },
      { status: 429 },
    );
  }

  const body = (await req.json().catch(() => null)) as {
    message?: string;
    history?: unknown;
    path?: string;
  } | null;

  const message = String(body?.message ?? "")
    .trim()
    .slice(0, MAX_MESSAGE_CHARS);
  if (message.length < 2) {
    return Response.json({ error: "Type a message first." }, { status: 400 });
  }

  const rawPath = String(body?.path ?? "/").slice(0, 200);
  const path = rawPath.startsWith("/") ? rawPath : "/";

  // Trust nothing about the transcript the client hands back: keep only well-formed
  // turns, clamp each one, and keep the tail.
  const history: ChatTurn[] = (Array.isArray(body?.history) ? body.history : [])
    .filter(
      (t): t is ChatTurn =>
        !!t &&
        typeof t === "object" &&
        ((t as ChatTurn).role === "user" || (t as ChatTurn).role === "assistant") &&
        typeof (t as ChatTurn).body === "string" &&
        (t as ChatTurn).body.trim().length > 0,
    )
    .slice(-MAX_HISTORY)
    .map((t) => ({ role: t.role, body: t.body.slice(0, MAX_MESSAGE_CHARS) }));

  // The API rejects a transcript that opens on an assistant turn, and the widget opens
  // with a greeting it wrote locally — so the first history entry is always one. Drop
  // any leading assistant turns rather than trusting the client to have stripped them.
  while (history.length > 0 && history[0].role === "assistant") history.shift();

  const content = await getContent();
  const tiles = await getTiles();
  const settings = await getSettings();
  const signedIn = Boolean(await currentUser());

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1200,
      system: buildSystemPrompt(content, tiles, settings, signedIn, path),
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: replySchema(tiles) },
      },
      messages: [
        ...history.map((t) => ({ role: t.role, content: t.body })),
        { role: "user" as const, content: message },
      ],
    });

    if (response.stop_reason === "refusal") {
      return Response.json(
        { error: "I can't help with that one — try the showroom on the number on our contact page." },
        { status: 502 },
      );
    }

    const textBlock = response.content.find(
      (b): b is Extract<(typeof response.content)[number], { type: "text" }> => b.type === "text",
    );
    if (!textBlock) {
      return Response.json(
        { error: "The assistant had a problem. Please try again in a moment." },
        { status: 502 },
      );
    }

    const parsed = JSON.parse(textBlock.text) as {
      reply: string;
      tileIds: string[];
      href: string;
    };

    // Re-resolve everything the model chose against the real data before it ships.
    const tileIds = parsed.tileIds.filter((id) => tiles.some((t) => t.id === id)).slice(0, 3);
    const href = parsed.href && LINKS[parsed.href] ? parsed.href : "";

    return Response.json({
      reply: parsed.reply,
      tileIds,
      link: href ? { href, label: LINKS[href] } : null,
    });
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.error("[chat] Anthropic error:", err.status, err.message);
      return Response.json(
        { error: "The assistant had a problem. Please try again in a moment." },
        { status: 502 },
      );
    }
    console.error("[chat] failed:", err);
    return Response.json(
      { error: "Couldn't reach the assistant. Please try again shortly." },
      { status: 502 },
    );
  }
}
