"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { type Tile } from "@/lib/tiles";
import { useTiles } from "@/components/StoreProvider";

type AiSurface = "floor" | "walls" | "both";

interface Suggestion {
  tileId: string;
  reason: string;
  surface: "floor" | "wall";
}

const LOADING_COPY = [
  "Studying your room's light and layout…",
  "Mixing the adhesive…",
  "Laying every tile by hand (digitally)…",
  "Matching grout to your colour palette…",
  "Polishing the finish…",
  "Standing back to admire the work…",
];

const KEY_NOTICE =
  "AI mode needs an API key — add OPENAI_API_KEY (and optionally ANTHROPIC_API_KEY) to .env.local";

/** Draggable before/after slider over two stacked images. */
function BeforeAfter({ before, after }: { before: string; after: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let dragging = false;
    const setFromX = (clientX: number) => {
      const r = wrap.getBoundingClientRect();
      setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
    };
    const down = (e: PointerEvent) => {
      dragging = true;
      setFromX(e.clientX);
      e.preventDefault();
    };
    const move = (e: PointerEvent) => {
      if (dragging) setFromX(e.clientX);
    };
    const up = () => {
      dragging = false;
    };
    wrap.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      wrap.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative select-none overflow-hidden rounded-xl border border-white/10 touch-none"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt="AI redesigned room" className="block w-full" draggable={false} />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={before}
          alt="Original room"
          className="block h-full w-full object-cover"
          draggable={false}
        />
        <span className="absolute left-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-[0.62rem] font-bold tracking-wider text-white">
          BEFORE
        </span>
      </div>
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-green/85 px-2.5 py-1 text-[0.62rem] font-bold tracking-wider text-white">
        AFTER
      </span>
      <div
        className="pointer-events-none absolute inset-y-0 z-10 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)]"
        style={{ left: `${pos}%` }}
      >
        <span className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[0.6rem] font-bold text-navy shadow-lg">
          ↔
        </span>
      </div>
    </div>
  );
}

export default function AiMode({
  tile,
  onSelectTile,
}: {
  tile: Tile;
  onSelectTile: (tile: Tile) => void;
  active: boolean;
}) {
  const tiles = useTiles();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [surface, setSurface] = useState<AiSurface>("floor");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [copyIdx, setCopyIdx] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keyNotice, setKeyNotice] = useState<string | null>(null);

  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);

  useEffect(() => {
    if (!loading) return;
    const t = window.setInterval(
      () => setCopyIdx((i) => (i + 1) % LOADING_COPY.length),
      2200,
    );
    return () => window.clearInterval(t);
  }, [loading]);

  const acceptFile = (f: File | undefined | null) => {
    if (!f || !f.type.startsWith("image/")) return;
    setFile(f);
    setResultUrl(null);
    setError(null);
    setKeyNotice(null);
    setSuggestions(null);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(f);
  };

  const generate = async () => {
    if (!file || loading) return;
    setLoading(true);
    setError(null);
    setKeyNotice(null);
    setResultUrl(null);
    setCopyIdx(0);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      fd.append("tileId", tile.id);
      fd.append("surface", surface);
      fd.append("notes", notes);
      const res = await fetch("/api/visualize", { method: "POST", body: fd });
      const json = (await res.json().catch(() => ({}))) as { image?: string; error?: string };
      if (res.status === 501) {
        setKeyNotice(json.error ?? KEY_NOTICE);
      } else if (!res.ok || !json.image) {
        setError(json.error ?? "The AI redesign failed. Please try again in a moment.");
      } else {
        setResultUrl(json.image);
      }
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const suggest = async () => {
    if (!file || suggesting) return;
    setSuggesting(true);
    setError(null);
    setKeyNotice(null);
    setSuggestions(null);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const res = await fetch("/api/suggest", { method: "POST", body: fd });
      const json = (await res.json().catch(() => ({}))) as {
        suggestions?: Suggestion[];
        error?: string;
      };
      if (res.status === 501) {
        setKeyNotice(json.error ?? KEY_NOTICE);
      } else if (!res.ok || !json.suggestions) {
        setError(json.error ?? "Couldn't get suggestions for this room. Please try again.");
      } else {
        setSuggestions(json.suggestions);
      }
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setSuggesting(false);
    }
  };

  const download = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.download = `aster-ai-${tile.id}.png`;
    a.href = resultUrl;
    a.click();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      {/* ── Stage ────────────────────────────────── */}
      <div className="min-w-0 space-y-4">
        <div className="relative flex min-h-[380px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-navy-2/40 p-3">
          {!previewUrl ? (
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                acceptFile(e.dataTransfer.files?.[0]);
              }}
              className={`flex w-full max-w-lg cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-8 py-16 text-center transition-colors ${
                dragOver ? "border-green bg-green/10" : "border-white/20 hover:border-green/60 hover:bg-white/[0.03]"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => acceptFile(e.target.files?.[0])}
              />
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green/15 text-2xl">✨</span>
              <span className="mt-4 font-display text-sm font-bold text-white">
                Drop a room photo for an AI redesign
              </span>
              <span className="mt-1 text-xs text-white/50">
                Our AI re-imagines your room with {tile.name} — furniture and light untouched
              </span>
            </label>
          ) : loading ? (
            <div className="w-full max-w-lg">
              {/* Shimmering tile grid */}
              <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square animate-pulse rounded bg-gradient-to-br from-green/25 to-navy-3"
                    style={{ animationDelay: `${(i % 4) * 150 + Math.floor(i / 4) * 100}ms` }}
                  />
                ))}
              </div>
              <p className="mt-6 text-center text-sm text-white/70" aria-live="polite">
                {LOADING_COPY[copyIdx]}
              </p>
              <p className="mt-1 text-center text-[0.68rem] text-white/40">
                AI redesigns usually take 15–40 seconds
              </p>
            </div>
          ) : resultUrl ? (
            <div className="w-full">
              <BeforeAfter before={previewUrl} after={resultUrl} />
            </div>
          ) : (
            <div className="relative w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Your room, ready for AI redesign"
                className="mx-auto block max-h-[520px] w-auto max-w-full rounded-xl"
              />
              <span className="absolute left-3 top-3 rounded-full bg-ink/70 px-3 py-1.5 text-[0.65rem] font-bold text-white backdrop-blur">
                Ready — press Generate
              </span>
            </div>
          )}
        </div>

        {keyNotice && (
          <div className="flex items-start gap-3 rounded-xl border border-gold/40 bg-gold/10 p-4">
            <span className="text-lg" aria-hidden="true">🔑</span>
            <div>
              <p className="text-sm font-semibold text-gold">AI mode is not configured yet</p>
              <p className="mt-1 text-xs leading-relaxed text-white/65">{keyNotice}</p>
              <p className="mt-1 text-xs text-white/45">
                The Design Studio and My Room Photo modes work without any keys.
              </p>
            </div>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-400/40 bg-red-400/10 p-4">
            <span className="text-lg" aria-hidden="true">⚠️</span>
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {/* Suggestions */}
        {suggestions && suggestions.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-navy-2/50 p-5">
            <div className="label mb-3 text-[0.62rem] text-green">AI Picks For This Room</div>
            <div className="grid gap-3 sm:grid-cols-3">
              {suggestions.map((s) => {
                const t = tiles.find((x) => x.id === s.tileId);
                if (!t) return null;
                return (
                  <button
                    key={`${s.tileId}-${s.surface}`}
                    type="button"
                    onClick={() => onSelectTile(t)}
                    className={`group rounded-xl border p-3 text-left transition-all ${
                      t.id === tile.id
                        ? "border-green/70 bg-green/10"
                        : "border-white/10 bg-ink/40 hover:border-green/50 hover:bg-ink/70"
                    }`}
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
                      <Image
                        src={t.texture}
                        alt={t.name}
                        fill
                        sizes="(min-width: 640px) 200px, 90vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="absolute left-2 top-2 rounded-full bg-ink/70 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider text-white">
                        {s.surface}
                      </span>
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white">{t.name}</div>
                    <p className="mt-1 text-[0.68rem] leading-relaxed text-white/55">{s.reason}</p>
                    <span className="mt-2 inline-block text-[0.65rem] font-bold text-green">
                      {t.id === tile.id ? "Selected ✓" : "Use this tile →"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Controls ─────────────────────────────── */}
      <div
        data-lenis-prevent
        className="thin-scroll space-y-5 overflow-y-auto rounded-2xl border border-white/10 bg-navy-2/50 p-5 xl:max-h-[640px]"
      >
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
            <Image src={tile.texture} alt={tile.name} fill sizes="64px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-bold text-white">{tile.name}</div>
            <div className="mt-0.5 text-[0.7rem] text-white/50">
              {tile.widthMm} × {tile.heightMm} mm · {tile.finish}
            </div>
            <div className="mt-0.5 text-[0.68rem] text-white/40">picked from the library ←</div>
          </div>
        </div>

        <div>
          <div className="label mb-2 text-[0.62rem] text-green">Redesign Surface</div>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["floor", "Floor"],
                ["walls", "Walls"],
                ["both", "Both"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSurface(key)}
                aria-pressed={surface === key}
                className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                  surface === key
                    ? "border-green bg-green/15 text-green"
                    : "border-white/10 text-white/55 hover:border-white/30 hover:text-white/85"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="label mb-2 block text-[0.62rem] text-green">Style Notes (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={400}
            placeholder="e.g. keep it bright and airy, warm lamplight in the evening…"
            className="w-full resize-none rounded-lg border border-white/10 bg-ink/60 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-green/60"
          />
        </label>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={generate}
            disabled={!file || loading}
            className="btn btn-green w-full justify-center disabled:pointer-events-none disabled:opacity-40"
          >
            {loading ? "Redesigning…" : resultUrl ? "Regenerate" : "Generate Redesign"}
          </button>
          <button
            type="button"
            onClick={suggest}
            disabled={!file || suggesting}
            className="btn btn-outline w-full justify-center disabled:pointer-events-none disabled:opacity-40"
          >
            {suggesting ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                Reading the room…
              </>
            ) : (
              "Suggest tiles for this room"
            )}
          </button>
          {resultUrl && (
            <>
              <button type="button" onClick={download} className="btn btn-outline w-full justify-center">
                Download Result
              </button>
              <button
                type="button"
                onClick={() => setResultUrl(null)}
                className="block w-full text-center text-xs text-white/45 underline-offset-2 hover:text-green hover:underline"
              >
                Try another tile — pick one from the library, then regenerate
              </button>
            </>
          )}
          {previewUrl && (
            <label className="block cursor-pointer text-center text-xs text-white/45 underline-offset-2 hover:text-green hover:underline">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => acceptFile(e.target.files?.[0])}
              />
              Use a different photo
            </label>
          )}
        </div>

        <p className="text-[0.65rem] leading-relaxed text-white/35">
          The AI keeps your furniture, layout and lighting, and re-surfaces only what you ask for.
          Results are a visual guide — colours may vary from physical samples.
        </p>
      </div>
    </div>
  );
}
