"use client";

import { useRef, useState } from "react";

const inputCls =
  "w-full rounded-xl border border-mist bg-off px-4 py-2.5 text-sm text-navy outline-none transition placeholder:text-muted/50 focus:border-green focus:ring-2 focus:ring-green/20";

/**
 * A media path field with an Upload button. Admins can paste a /media/…
 * path or upload a file straight from their computer; the stored value is
 * always the public path.
 */
export default function MediaInput({
  value,
  onChange,
  folder,
  accept = "image/*",
  label,
  placeholder,
  preview = "image",
}: {
  value: string;
  onChange: (path: string) => void;
  /** public/media subfolder the upload is stored in */
  folder: "tiles" | "video" | "stills" | "gallery" | "categories" | "staff";
  accept?: string;
  label?: string;
  placeholder?: string;
  /** "image" shows a thumbnail, "video" a filename chip, "none" nothing */
  preview?: "image" | "video" | "none";
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    form.append("filename", file.name);
    form.append("folder", folder);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.path) {
        onChange(data.path);
      } else {
        setError(data?.error ?? "Upload failed.");
      }
    } catch {
      setError("Upload failed — check your connection.");
    }
    setBusy(false);
  };

  return (
    <div>
      {label && <span className="mb-1.5 block font-display text-xs font-bold text-navy">{label}</span>}
      <div className="flex items-center gap-2">
        {preview === "image" && value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="h-10 w-10 shrink-0 rounded-lg border border-mist object-cover"
          />
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? `/media/${folder}/…`}
          className={inputCls}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="shrink-0 rounded-xl border border-green/40 bg-green/10 px-4 py-2.5 font-display text-xs font-bold text-green transition hover:bg-green hover:text-white disabled:opacity-60"
        >
          {busy ? "Uploading…" : "Upload"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}
