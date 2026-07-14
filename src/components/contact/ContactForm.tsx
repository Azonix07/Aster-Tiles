"use client";

import { useRef, useState } from "react";
import posthog from "posthog-js";
import { useSite } from "@/components/StoreProvider";

const INTERESTS = [
  "Floor Tiles",
  "Wall Tiles",
  "Bathrooms",
  "Wooden Floors",
  "Outdoor",
  "Kitchen",
  "Room Visualizer help",
] as const;

type FieldName = "name" | "phone" | "email" | "message";
type Errors = Partial<Record<FieldName, string>>;

function prettySize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Contact enquiry form. Validates client-side, then hands the enquiry to
 * the visitor's email app via a pre-filled mailto: link — no backend.
 * An optional room photo is held client-side so we can remind them to
 * attach it to the email.
 */
export default function ContactForm() {
  const site = useSite();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState<string>(INTERESTS[0]);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [dragOver, setDragOver] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = (): Errors => {
    const errs: Errors = {};
    if (name.trim().length < 2) errs.name = "Please tell us your name.";
    if (!/^\+?[\d\s\-().]{7,}$/.test(phone.trim()))
      errs.phone = "Enter a phone number we can ring you back on.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))
      errs.email = "Enter a valid email address.";
    if (message.trim().length < 10)
      errs.message = "Tell us a little about your project (a sentence will do).";
    return errs;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const lines = [
      `Name: ${name.trim()}`,
      `Phone: ${phone.trim()}`,
      `Email: ${email.trim()}`,
      `Interested in: ${interest}`,
      "",
      message.trim(),
    ];
    if (file) {
      lines.push("", `[Please remember to attach your room photo: ${file.name}]`);
    }
    const href = `${site.emailHref}?subject=${encodeURIComponent(
      `Website enquiry — ${interest}`,
    )}&body=${encodeURIComponent(lines.join("\n"))}`;

    posthog.capture("contact_enquiry_sent", {
      interest_area: interest,
      has_room_photo: !!file,
    });
    window.location.href = href;
    setSentTo(name.trim().split(/\s+/)[0]);
  };

  const reset = () => {
    setName("");
    setPhone("");
    setEmail("");
    setInterest(INTERESTS[0]);
    setMessage("");
    setFile(null);
    setErrors({});
    setSentTo(null);
  };

  const inputCls = (bad?: string) =>
    `w-full rounded-xl border bg-off px-4 py-3 text-sm text-navy outline-none transition placeholder:text-muted/50 ${
      bad
        ? "border-red-400 ring-2 ring-red-300/40"
        : "border-mist focus:border-green focus:ring-2 focus:ring-green/20"
    }`;

  /* ── Success panel ─────────────────────────────── */
  if (sentTo) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-lift sm:p-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green/15">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2db87c" strokeWidth="2.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="display mt-6 text-2xl text-navy sm:text-3xl">
          Thanks {sentTo} —{" "}
          <em className="not-italic text-green">we’re on it.</em>
        </h3>
        <p className="mt-4 max-w-md text-muted">
          We’ll ring you back within one working day. Your email app should
          have opened with everything filled in — just press send
          {file ? " and attach your room photo" : ""}.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button type="button" onClick={reset} className="btn btn-ghost-dark">
            Send another message
          </button>
          <a href={site.phoneHref} className="text-sm font-semibold text-green hover:text-green-2">
            Or ring us now: {site.phone}
          </a>
        </div>
      </div>
    );
  }

  /* ── Form ──────────────────────────────────────── */
  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl bg-white p-6 shadow-lift sm:p-9"
    >
      <p className="label text-green">Send a message</p>
      <h2 className="display mt-2 text-2xl text-navy sm:text-3xl">
        Tell us about your <em className="not-italic text-green">project</em>
      </h2>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        {/* Name */}
        <div>
          <label htmlFor="cf-name" className="mb-1.5 block font-display text-xs font-bold text-navy">
            Your name
          </label>
          <input
            id="cf-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mary Doherty"
            autoComplete="name"
            aria-invalid={!!errors.name}
            className={inputCls(errors.name)}
          />
          {errors.name && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.name}</p>}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="cf-phone" className="mb-1.5 block font-display text-xs font-bold text-navy">
            Phone
          </label>
          <input
            id="cf-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={site.phone}
            autoComplete="tel"
            aria-invalid={!!errors.phone}
            className={inputCls(errors.phone)}
          />
          {errors.phone && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.phone}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="cf-email" className="mb-1.5 block font-display text-xs font-bold text-navy">
            Email
          </label>
          <input
            id="cf-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.ie"
            autoComplete="email"
            aria-invalid={!!errors.email}
            className={inputCls(errors.email)}
          />
          {errors.email && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.email}</p>}
        </div>

        {/* Interested in */}
        <div>
          <label htmlFor="cf-interest" className="mb-1.5 block font-display text-xs font-bold text-navy">
            I’m interested in
          </label>
          <div className="relative">
            <select
              id="cf-interest"
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              className={`${inputCls()} appearance-none pr-10`}
            >
              {INTERESTS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4a5f78"
              strokeWidth="2.5"
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>

        {/* Message */}
        <div className="sm:col-span-2">
          <label htmlFor="cf-message" className="mb-1.5 block font-display text-xs font-bold text-navy">
            Your message
          </label>
          <textarea
            id="cf-message"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Room sizes, the look you’re after, timelines — anything that helps."
            aria-invalid={!!errors.message}
            className={`${inputCls(errors.message)} resize-y`}
          />
          {errors.message && (
            <p className="mt-1.5 text-xs font-medium text-red-500">{errors.message}</p>
          )}
        </div>

        {/* Room photo dropzone */}
        <div className="sm:col-span-2">
          <span className="mb-1.5 block font-display text-xs font-bold text-navy">
            Room photo <span className="font-normal text-muted">(optional)</span>
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label="Attach a room photo"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-green/40 bg-green/5 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green/15">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2db87c" strokeWidth="2" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <circle cx="8.5" cy="10" r="1.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-4.5-4.5L9 18" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-navy">{file.name}</div>
                  <div className="text-xs text-muted">{prettySize(file.size)} · ready to attach</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="shrink-0 text-xs font-bold text-muted transition hover:text-red-500"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const dropped = e.dataTransfer.files?.[0];
                if (dropped && dropped.type.startsWith("image/")) setFile(dropped);
              }}
              className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 transition ${
                dragOver
                  ? "border-green bg-green/5"
                  : "border-mist bg-off hover:border-green/60 hover:bg-green/5"
              }`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2db87c" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L7 9m5-5l5 5M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2" />
              </svg>
              <span className="text-sm font-semibold text-navy">
                Drop a photo of your room here
              </span>
              <span className="text-xs text-muted">
                or click to browse — we’ll match tiles to your space
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-5">
        <button type="submit" className="btn btn-green">
          Send enquiry
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
        <p className="text-xs text-muted">
          Opens your email app with everything filled in — nothing is stored
          on our site.
        </p>
      </div>
    </form>
  );
}
