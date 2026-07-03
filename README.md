# Aster Tiles — Cinematic Next.js Site

Premium tiles, wooden floors & bathrooms — The Haw, Lifford, Co. Donegal.
This is the Next.js upgrade of the original single-file `index.html` site, rebuilt as a
scroll-driven cinematic experience with an AI-powered Room Visualizer.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

## The shop (cart, checkout, accounts, admin)

The site is a full store. Everything lives in a JSON database at `data/db.json`,
created automatically on first run (delete the file to reset to factory data).

- **Buy tiles** — every tile has a product page (`/tiles/<id>`) priced per m²; cart →
  checkout with delivery address; **Cash on Delivery** is live, **Razorpay** is shown
  as "coming soon" (display only for now).
- **Accounts** — `/register`, `/login`, `/account` (order history with live tracking,
  saved delivery addresses).
- **Admin panel** — `/admin`: dashboard stats, order management (update status +
  timeline notes the customer sees), full tile catalogue editing (prices, images,
  stock), all site content editing (contact info, hours, stats, team, testimonials,
  collections, gallery), and settings (currency symbol, delivery fees, payment
  toggles, maintenance).
- **Maintenance modes** (admin → Settings): *Full-site* shows visitors a maintenance
  page (admins still see everything); *Pause ordering only* keeps the whole site
  browsable but switches checkout off.

> **Default admin login:** `admin@astertiles.ie` / `admin123` — **change this**
> (edit the seeded user's email in `data/db.json` or register a new account and set
> `"isAdmin": true` on it, then delete the old one).

## The scroll journey (home page)

The home page is a single continuous story driven by GSAP ScrollTrigger + Lenis smooth scroll:

1. **Arrival** — scroll-scrubbed video dolly toward the showroom door
2. **Step inside** — scrubbed glide down the showroom walkway, stats count up
3. **The Tile Room** — pinned horizontal rail through the six collections
4. **Why Aster** — reveal cards
5. **Real homes** — parallax inspiration wall
6. **Meet the staff** — scrubbed push-in to the team at the counter
7. **Visualizer teaser** — live tile-swap preview
8. **Reviews + visit us**

### How video scrubbing works

The journey videos were AI-generated (Higgsfield: Nano Banana Pro stills → Kling 3.0 pro
image-to-video, single continuous camera moves), then re-encoded **all-keyframe**
(`ffmpeg -g 1`) so any `currentTime` seek lands instantly. `ScrubVideo`
([src/components/scroll/ScrubVideo.tsx](src/components/scroll/ScrubVideo.tsx)) pins the
section, maps scroll progress → video time with per-frame lerp smoothing, and fades
overlay "chapters" in/out via `data-window="start,end"` fractions.

All media in `public/media/` (stills, tiles, categories, gallery, staff, video) was
generated for this site — no hotlinked stock.

## Room Visualizer (`/visualizer`)

Three modes:

- **Design Studio** — perspective 3D room render on canvas; pick any catalog tile,
  set room dimensions, grout colour/width, layout; true-scale tiling with live
  coverage calculator (+10% waste buffer) and cost estimate.
- **My Room Photo** — upload a photo, outline the floor (4-point quad) or a wall
  (polygon); the tile is perspective-warped onto the surface via homography
  (triangle-mesh warp). Before/after slider, download.
- **AI Redesign** — upload a photo and let AI re-lay the surface with the selected
  tile photorealistically, plus "suggest tiles for this room".

### AI keys (optional — everything else works without them)

Copy `.env.example` → `.env.local`:

| Key | Powers | Why this provider |
|---|---|---|
| `OPENAI_API_KEY` | AI Redesign (`/api/visualize`) | Image *generation/editing* — the Claude API does not generate images, so room re-rendering uses OpenAI's image-edit endpoint (`gpt-image-1`). |
| `ANTHROPIC_API_KEY` | Tile suggestions (`/api/suggest`) | Claude (`claude-opus-4-8`) vision + structured outputs analyses the room photo and recommends catalog tiles with reasoning. |

Missing keys degrade gracefully: the UI shows a friendly notice and the two canvas
modes keep working.

## Stack

- Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind v4 (`@theme` tokens)
- GSAP 3 + ScrollTrigger (pins, scrubs, horizontal rail) · Lenis (smooth scroll)
- Canvas 2D visualizer engine (`src/lib/visualizer/`)
- Brand: navy `#0c2340` · emerald `#2db87c` · gold `#c9a84c`; Sora / Inter / Instrument Serif
- Reduced-motion: all reveals/scrubs respect `prefers-reduced-motion`

## Structure

```
src/
  app/               pages: / /collections /visualizer /about /contact + api routes
  components/
    scroll/          ScrubVideo, Reveal, Parallax, Counter — the animation primitives
    home/            the journey acts
    visualizer/      the visualizer app
  lib/               site constants, tile catalog, gsap setup, visualizer engine
public/media/        generated stills, tile textures, photos, scrub videos
```
# Aster-Tiles
