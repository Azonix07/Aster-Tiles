"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HomeText, SiteMedia, VideoSlot } from "@/lib/db";
import MediaInput from "@/components/admin/MediaInput";

const inputCls =
  "w-full rounded-xl border border-mist bg-off px-4 py-2.5 text-sm text-navy outline-none transition placeholder:text-muted/50 focus:border-green focus:ring-2 focus:ring-green/20";
const labelCls = "mb-1.5 block font-display text-xs font-bold text-navy";
const cardCls = "rounded-2xl border border-mist bg-white p-6 shadow-sm sm:p-8";

function useSaveSection() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (section: "media" | "home", value: unknown) => {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, value }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Could not save.");
    }
    setBusy(false);
  };

  return { save, busy, saved, error };
}

function SaveButton({ busy, saved }: { busy: boolean; saved: boolean }) {
  return (
    <button type="submit" disabled={busy} className="btn btn-green px-6 py-2.5 text-xs disabled:opacity-60">
      {busy ? "Saving…" : saved ? "Saved" : "Save this section"}
    </button>
  );
}

/* ── Video + poster slot editor ────────────────────── */

function VideoSlotFields({
  title,
  hint,
  slot,
  onChange,
}: {
  title: string;
  hint: string;
  slot: VideoSlot;
  onChange: (slot: VideoSlot) => void;
}) {
  return (
    <div className="rounded-xl border border-mist p-4">
      <p className="font-display text-sm font-bold text-navy">{title}</p>
      <p className="mt-0.5 text-xs text-muted">{hint}</p>
      <div className="mt-4 space-y-4">
        <MediaInput
          label="Video file (MP4/WebM)"
          value={slot.src}
          onChange={(src) => onChange({ ...slot, src })}
          folder="video"
          accept="video/mp4,video/webm"
          preview="none"
        />
        <MediaInput
          label="Poster image (shown while the video loads)"
          value={slot.poster}
          onChange={(poster) => onChange({ ...slot, poster })}
          folder="video"
          accept="image/*"
        />
      </div>
    </div>
  );
}

/* ── Media form — every background video & image ───── */

export function MediaForm({ initial }: { initial: SiteMedia }) {
  const { save, busy, saved, error } = useSaveSection();
  const [form, setForm] = useState<SiteMedia>(structuredClone(initial));

  const setImage = (field: keyof SiteMedia) => (path: string) =>
    setForm((p) => ({ ...p, [field]: path }));

  const images: { field: keyof SiteMedia; title: string; hint: string; folder: "stills" | "gallery" }[] = [
    { field: "visualizerTeaserImage", title: "Home — visualizer preview room", hint: "The room photo in the “See it before you buy it” section.", folder: "stills" },
    { field: "contactCtaImage", title: "Home — visit-us background", hint: "Faded background photo behind the closing “kettle's on” section.", folder: "stills" },
    { field: "collectionsBreakImage", title: "Collections — full-width break", hint: "The cinematic full-screen photo between the range and the closing CTA.", folder: "gallery" },
    { field: "aboutHeroImage", title: "About — opening shot", hint: "Full-bleed image behind “Rooted in Donegal”.", folder: "stills" },
    { field: "aboutStoryImage", title: "About — story photo", hint: "The framed photo beside the founding story.", folder: "stills" },
    { field: "aboutShowroomImage", title: "About — showroom entrance", hint: "The photo beside the opening hours.", folder: "stills" },
    { field: "ogImage", title: "Social share image", hint: "Shown when the site is shared on WhatsApp, Facebook, etc.", folder: "stills" },
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save("media", form);
      }}
      className={cardCls}
    >
      <h2 className="display text-xl text-navy">Background videos</h2>
      <p className="mt-1 text-xs text-muted">
        The scroll-driven films on the home page and the Collections hero loop. Upload a new
        file or paste a /media/… path; changes go live on save.
      </p>

      <div className="mt-6 space-y-5">
        <VideoSlotFields
          title="Home — arrival film"
          hint="Scene one: the street approach to the showroom door."
          slot={form.heroVideo}
          onChange={(heroVideo) => setForm((p) => ({ ...p, heroVideo }))}
        />
        <VideoSlotFields
          title="Home — showroom film"
          hint="Scene two: gliding down the main walkway."
          slot={form.showroomVideo}
          onChange={(showroomVideo) => setForm((p) => ({ ...p, showroomVideo }))}
        />
        <VideoSlotFields
          title="Home — team film"
          hint="Scene three: arriving at the counter to meet the team."
          slot={form.staffVideo}
          onChange={(staffVideo) => setForm((p) => ({ ...p, staffVideo }))}
        />
        <VideoSlotFields
          title="Collections — hero loop"
          hint="The looping tile-aisle video at the top of the Collections page."
          slot={form.collectionsVideo}
          onChange={(collectionsVideo) => setForm((p) => ({ ...p, collectionsVideo }))}
        />
      </div>

      <h2 className="display mt-10 text-xl text-navy">Section images</h2>
      <p className="mt-1 text-xs text-muted">Large photos used as section backgrounds around the site.</p>

      <div className="mt-6 space-y-5">
        {images.map(({ field, title, hint, folder }) => (
          <div key={field} className="rounded-xl border border-mist p-4">
            <p className="font-display text-sm font-bold text-navy">{title}</p>
            <p className="mt-0.5 text-xs text-muted">{hint}</p>
            <div className="mt-3">
              <MediaInput
                value={form[field] as string}
                onChange={setImage(field)}
                folder={folder}
                accept="image/*"
              />
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-sm font-medium text-red-500">{error}</p>}
      <div className="mt-6">
        <SaveButton busy={busy} saved={saved} />
      </div>
    </form>
  );
}

/* ── Home page copy ─────────────────────────────────── */

export function HomeTextForm({ initial }: { initial: HomeText }) {
  const { save, busy, saved, error } = useSaveSection();
  const [form, setForm] = useState<HomeText>(structuredClone(initial));

  const set = (field: keyof HomeText) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const text = (field: keyof HomeText, label: string, rows = 1) => (
    <div className="sm:col-span-2">
      <label className={labelCls}>{label}</label>
      {rows > 1 ? (
        <textarea rows={rows} required value={form[field] as string} onChange={set(field)} className={`${inputCls} resize-y`} />
      ) : (
        <input required value={form[field] as string} onChange={set(field)} className={inputCls} />
      )}
    </div>
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save("home", { ...form, marquee: form.marquee.filter((m) => m.trim() !== "") });
      }}
      className={cardCls}
    >
      <h2 className="display text-xl text-navy">Home page headlines</h2>
      <p className="mt-1 text-xs text-muted">
        The words over the three scroll scenes. Wrap a phrase in *asterisks* to give it the
        green italic accent; press Enter in a headline for a line break.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {text("heroBadge", "Opening badge")}
        {text("heroHeadline", "Main headline", 2)}
        {text("heroSub", "Main sub-line", 2)}
        {text("heroAddressLabel", "Scene 1 — address label")}
        {text("heroAddressHeadline", "Scene 1 — address headline", 2)}
        {text("heroClosingHeadline", "Scene 1 — closing line")}
        {text("heroClosingSub", "Scene 1 — closing sub-line")}
        {text("showroomLabel", "Scene 2 — label")}
        {text("showroomHeadline", "Scene 2 — headline", 2)}
        {text("staffLabel", "Scene 3 — label")}
        {text("staffHeadline", "Scene 3 — headline", 2)}
      </div>

      <h3 className="mt-8 font-display text-sm font-bold text-navy">Trust marquee lines</h3>
      <p className="mt-1 text-xs text-muted">The scrolling strip of promises under the hero.</p>
      <div className="mt-3 space-y-3">
        {form.marquee.map((m, i) => (
          <div key={i} className="flex gap-2">
            <input
              aria-label={`Marquee line ${i + 1}`}
              value={m}
              onChange={(e) =>
                setForm((p) => ({ ...p, marquee: p.marquee.map((row, j) => (j === i ? e.target.value : row)) }))
              }
              className={inputCls}
            />
            <button
              type="button"
              aria-label="Remove line"
              onClick={() => setForm((p) => ({ ...p, marquee: p.marquee.filter((_, j) => j !== i) }))}
              className="shrink-0 text-xs font-bold text-muted hover:text-red-500"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setForm((p) => ({ ...p, marquee: [...p.marquee, ""] }))}
          className="text-xs font-bold text-green hover:text-green-2"
        >
          + Add a line
        </button>
      </div>

      {error && <p className="mt-4 text-sm font-medium text-red-500">{error}</p>}
      <div className="mt-6">
        <SaveButton busy={busy} saved={saved} />
      </div>
    </form>
  );
}
