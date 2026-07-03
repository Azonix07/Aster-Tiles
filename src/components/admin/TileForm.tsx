"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { DbTile } from "@/lib/db";
import { effectivePrice } from "@/lib/pricing";
import { money } from "@/lib/format";
import { processTileImage, type ProcessResult } from "@/lib/imageProcessor";

const inputCls =
  "w-full rounded-xl border border-mist bg-off px-4 py-2.5 text-sm text-navy outline-none transition placeholder:text-muted/50 focus:border-green focus:ring-2 focus:ring-green/20";
const labelCls = "mb-1.5 block font-display text-xs font-bold text-navy";

interface TileFields {
  id: string;
  name: string;
  widthMm: string;
  heightMm: string;
  finish: string;
  material: string;
  category: string;
  texture: string;
  defaultGrout: string;
  pricePerSqm: string;
  discountPercent: string;
  bestFor: string;
  description: string;
  inStock: boolean;
}

function toFields(tile?: DbTile): TileFields {
  return {
    id: tile?.id ?? "",
    name: tile?.name ?? "",
    widthMm: String(tile?.widthMm ?? 600),
    heightMm: String(tile?.heightMm ?? 600),
    finish: tile?.finish ?? "Matt",
    material: tile?.material ?? "Porcelain",
    category: tile?.category ?? "stone",
    texture: tile?.texture ?? "",
    defaultGrout: tile?.defaultGrout ?? "#d8d4cf",
    pricePerSqm: String(tile?.pricePerSqm ?? 30),
    discountPercent: String(tile?.discountPercent ?? 0),
    bestFor: (tile?.bestFor ?? []).join(", "),
    description: tile?.description ?? "",
    inStock: tile?.inStock ?? true,
  };
}

/* ── Upload status types ─────────────────────── */
type UploadPhase = "idle" | "processing" | "uploading" | "done" | "error";

/* ── SVG icons ───────────────────────────────── */

function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted/50">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ── Component ───────────────────────────────── */

export default function TileForm({ tile }: { tile?: DbTile }) {
  const router = useRouter();
  const isNew = !tile;
  const [form, setForm] = useState<TileFields>(toFields(tile));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  // Image upload state
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");
  const [uploadProgress, setUploadProgress] = useState("");
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processedBlobRef = useRef<ProcessResult | null>(null);

  const set =
    (field: keyof TileFields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  /* ── Image processing + upload ─────────────── */

  const handleImageFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/") && !file.name.toLowerCase().endsWith(".heic")) {
        setError("Please select an image file (JPG, PNG, WebP, HEIC).");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setError("Image too large (max 20 MB).");
        return;
      }

      setError(null);
      setUploadPhase("processing");
      setUploadProgress("Analyzing image...");

      try {
        // Step 1: AI-enhanced processing
        await new Promise((r) => setTimeout(r, 300)); // brief UI delay
        setUploadProgress("Smart cropping to square...");
        await new Promise((r) => setTimeout(r, 200));

        setUploadProgress("AI-enhancing resolution...");
        const result = await processTileImage(file, form.name || form.id);
        processedBlobRef.current = result;

        setUploadProgress("Applying sharpening filters...");
        await new Promise((r) => setTimeout(r, 300));

        setProcessedPreview(result.previewUrl);
        setUploadProgress("Enhancement complete — uploading...");
        setUploadPhase("uploading");

        // Step 2: Upload to server
        const fd = new FormData();
        fd.append("file", result.blob, result.filename);
        fd.append("filename", result.filename);

        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json();

        if (res.ok && data.path) {
          setForm((prev) => ({ ...prev, texture: data.path }));
          setUploadPhase("done");
          setUploadProgress(`Saved as ${data.filename}`);
        } else {
          throw new Error(data.error || "Upload failed.");
        }
      } catch (err) {
        setUploadPhase("error");
        setUploadProgress(err instanceof Error ? err.message : "Processing failed.");
      }
    },
    [form.name, form.id],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleImageFile(file);
    },
    [handleImageFile],
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleImageFile(file);
    },
    [handleImageFile],
  );

  /* ── Form submission ───────────────────────── */

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      ...form,
      widthMm: Number(form.widthMm),
      heightMm: Number(form.heightMm),
      pricePerSqm: Number(form.pricePerSqm),
      discountPercent: Number(form.discountPercent),
      inStock: form.inStock,
    };
    const res = await fetch(isNew ? "/api/admin/tiles" : `/api/admin/tiles/${tile.id}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (res.ok) {
      if (isNew) {
        router.push("/admin/tiles");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
      router.refresh();
    } else {
      setError(data?.error ?? "Could not save the tile.");
    }
    setBusy(false);
  };

  const remove = async () => {
    if (!tile) return;
    if (!window.confirm(`Delete "${tile.name}" from the catalogue? This can't be undone.`)) return;
    await fetch(`/api/admin/tiles/${tile.id}`, { method: "DELETE" });
    router.push("/admin/tiles");
    router.refresh();
  };

  /* ── Upload phase indicator ────────────────── */
  const phaseColor =
    uploadPhase === "processing"
      ? "text-blue-600"
      : uploadPhase === "uploading"
        ? "text-amber-600"
        : uploadPhase === "done"
          ? "text-emerald-600"
          : uploadPhase === "error"
            ? "text-red-500"
            : "text-muted";

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
      <div className="rounded-2xl border border-mist bg-white p-6 shadow-sm sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="tf-name" className={labelCls}>Name</label>
            <input id="tf-name" required value={form.name} onChange={set("name")} placeholder="Venus Bianco" className={inputCls} />
          </div>
          <div>
            <label htmlFor="tf-id" className={labelCls}>
              URL id {isNew ? "" : "(fixed)"}
            </label>
            <input
              id="tf-id"
              value={form.id}
              onChange={set("id")}
              disabled={!isNew}
              required={isNew}
              placeholder="venus-bianco"
              className={`${inputCls} disabled:opacity-60`}
            />
          </div>
          <div>
            <label htmlFor="tf-price" className={labelCls}>Price per m²</label>
            <input id="tf-price" required type="number" min="0.5" step="0.01" value={form.pricePerSqm} onChange={set("pricePerSqm")} className={inputCls} />
          </div>
          <div>
            <label htmlFor="tf-discount" className={labelCls}>Discount %</label>
            <input id="tf-discount" type="number" min="0" max="100" step="1" value={form.discountPercent} onChange={set("discountPercent")} className={inputCls} />
            <p className="mt-1 text-[0.7rem] text-muted">0 = no discount. 10 = 10% off the price.</p>
          </div>
          <div>
            <label htmlFor="tf-category" className={labelCls}>Category</label>
            <select id="tf-category" value={form.category} onChange={set("category")} className={inputCls}>
              <option value="stone">Stone &amp; Marble</option>
              <option value="wood">Wood Effect</option>
              <option value="metro">Metro</option>
              <option value="pattern">Pattern</option>
            </select>
          </div>
          <div>
            <label htmlFor="tf-width" className={labelCls}>Width (mm)</label>
            <input id="tf-width" required type="number" min="1" value={form.widthMm} onChange={set("widthMm")} className={inputCls} />
          </div>
          <div>
            <label htmlFor="tf-height" className={labelCls}>Height (mm)</label>
            <input id="tf-height" required type="number" min="1" value={form.heightMm} onChange={set("heightMm")} className={inputCls} />
          </div>
          <div>
            <label htmlFor="tf-material" className={labelCls}>Material</label>
            <input id="tf-material" required value={form.material} onChange={set("material")} placeholder="Porcelain" className={inputCls} />
          </div>
          <div>
            <label htmlFor="tf-finish" className={labelCls}>Finish</label>
            <input id="tf-finish" required value={form.finish} onChange={set("finish")} placeholder="Matt" className={inputCls} />
          </div>

          {/* ── Image Upload Section ──────────────── */}
          <div className="sm:col-span-2">
            <label className={labelCls}>
              Tile Image
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[0.6rem] font-bold text-violet-700">
                <SparklesIcon /> AI Enhanced
              </span>
            </label>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all ${
                dragOver
                  ? "border-green bg-green/5 shadow-lg shadow-green/10"
                  : uploadPhase === "done"
                    ? "border-emerald-300 bg-emerald-50/50"
                    : "border-mist bg-off hover:border-green/50 hover:bg-green/5"
              } p-6`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.heic"
                onChange={onFileChange}
                className="hidden"
                aria-label="Upload tile image"
              />

              {/* Preview or placeholder */}
              <div className="flex items-center gap-4">
                {processedPreview ? (
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={processedPreview}
                      alt="Processed tile"
                      className="h-full w-full object-cover"
                    />
                    {uploadPhase === "done" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/20">
                        <span className="rounded-full bg-emerald-500 p-1 text-white"><CheckIcon /></span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-mist/50">
                    <UploadIcon />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  {uploadPhase === "idle" ? (
                    <>
                      <p className="text-sm font-semibold text-navy">
                        Drop an image here or click to browse
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        JPG, PNG, WebP or HEIC up to 20 MB. Image will be auto-cropped to square, upscaled, flattened and sharpened.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        {(uploadPhase === "processing" || uploadPhase === "uploading") && (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-green border-t-transparent" />
                        )}
                        <p className={`text-sm font-semibold ${phaseColor}`}>
                          {uploadProgress}
                        </p>
                      </div>
                      {uploadPhase === "done" && (
                        <p className="mt-1 text-xs text-muted">
                          Click to replace with a different image.
                        </p>
                      )}
                      {uploadPhase === "error" && (
                        <p className="mt-1 text-xs text-red-400">
                          Click to try again with a different image.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Processing progress bar */}
              {(uploadPhase === "processing" || uploadPhase === "uploading") && (
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-mist/50">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      uploadPhase === "uploading" ? "w-4/5 bg-amber-500" : "w-2/5 bg-blue-500"
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Manual path fallback */}
            <div className="mt-3">
              <label htmlFor="tf-texture" className="mb-1 block text-[0.68rem] font-semibold text-muted">
                Or enter path manually
              </label>
              <input
                id="tf-texture"
                required
                value={form.texture}
                onChange={set("texture")}
                placeholder="/media/tiles/venus-bianco.jpg"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label htmlFor="tf-grout" className={labelCls}>Suggested grout colour</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                aria-label="Grout colour picker"
                value={/^#[0-9a-fA-F]{6}$/.test(form.defaultGrout) ? form.defaultGrout : "#d8d4cf"}
                onChange={set("defaultGrout")}
                className="h-10 w-12 cursor-pointer rounded-lg border border-mist"
              />
              <input id="tf-grout" value={form.defaultGrout} onChange={set("defaultGrout")} className={inputCls} />
            </div>
          </div>
          <div>
            <label htmlFor="tf-bestfor" className={labelCls}>Best for <span className="font-normal text-muted">(comma separated)</span></label>
            <input id="tf-bestfor" value={form.bestFor} onChange={set("bestFor")} placeholder="Bathrooms, Kitchens" className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="tf-desc" className={labelCls}>Description</label>
            <textarea id="tf-desc" rows={3} required value={form.description} onChange={set("description")} className={`${inputCls} resize-y`} />
          </div>
          <label className="flex items-center gap-2.5 text-sm text-navy sm:col-span-2">
            <input
              type="checkbox"
              checked={form.inStock}
              onChange={(e) => setForm((prev) => ({ ...prev, inStock: e.target.checked }))}
              className="h-4 w-4 accent-green"
            />
            In stock — customers can add this tile to their cart
          </label>
        </div>

        {error && <p className="mt-4 text-sm font-medium text-red-500">{error}</p>}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={busy} className="btn btn-green disabled:opacity-60">
            {busy ? "Saving\u2026" : saved ? "Saved \u2713" : isNew ? "Add tile" : "Save changes"}
          </button>
          {!isNew && (
            <button type="button" onClick={remove} className="text-sm font-bold text-red-500 hover:text-red-600">
              Delete tile
            </button>
          )}
        </div>
      </div>

      {/* live preview */}
      <aside className="rounded-2xl border border-mist bg-white p-6 shadow-sm">
        <p className="font-display text-xs font-bold tracking-wide text-muted uppercase">Preview</p>
        <div className="relative mt-4 aspect-square overflow-hidden rounded-xl bg-mist">
          {(processedPreview || form.texture) && (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview accepts arbitrary URLs
            <img src={processedPreview || form.texture} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          {form.finish && (
            <span className="absolute top-3 left-3 rounded-full bg-ink/65 px-3 py-1 font-display text-[0.62rem] font-bold tracking-[0.08em] text-white uppercase">
              {form.finish}
            </span>
          )}
          {Number(form.discountPercent) > 0 && (
            <span className="absolute top-3 right-3 rounded-full bg-red-500 px-3 py-1 font-display text-[0.62rem] font-bold tracking-[0.08em] text-white uppercase">
              {form.discountPercent}% OFF
            </span>
          )}
        </div>
        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg font-bold text-navy">{form.name || "Tile name"}</p>
            <p className="mt-1 text-xs text-muted">
              {form.material || "Material"} &middot; {form.widthMm || "?"} &times; {form.heightMm || "?"} mm
            </p>
          </div>
          <div className="text-right">
            {Number(form.discountPercent) > 0 ? (
              <>
                <p className="font-display text-sm text-muted line-through">
                  {money(Number(form.pricePerSqm) || 0, "\u20ac")}
                </p>
                <p className="font-display text-lg font-bold text-red-500">
                  {money(
                    effectivePrice({ pricePerSqm: Number(form.pricePerSqm) || 0, discountPercent: Number(form.discountPercent) }),
                    "\u20ac"
                  )}
                </p>
              </>
            ) : (
              <p className="font-display text-lg font-bold text-navy">{form.pricePerSqm || "\u2014"}</p>
            )}
          </div>
        </div>

        {/* AI processing info */}
        {processedPreview && (
          <div className="mt-4 rounded-lg bg-violet-50 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[0.65rem] font-bold text-violet-700">
              <SparklesIcon /> AI Enhanced
            </div>
            <p className="mt-0.5 text-[0.6rem] text-violet-600/70">
              Auto-cropped to square, upscaled to 800&times;800px, sharpened &amp; colour-enhanced.
            </p>
          </div>
        )}
      </aside>
    </form>
  );
}
