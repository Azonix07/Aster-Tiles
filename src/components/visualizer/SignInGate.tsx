"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const inputCls =
  "w-full rounded-xl border border-mist bg-off px-4 py-3 text-sm text-navy outline-none transition placeholder:text-muted/50 focus:border-green focus:ring-2 focus:ring-green/20";
const labelCls = "mb-1.5 block font-display text-xs font-bold text-navy";

function LockIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className={className}
    >
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path strokeLinecap="round" d="M8 10.5V7.7a4 4 0 0 1 8 0v2.8" />
      <circle cx="12" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Sign-in modal for gated visualizer features. Accepts email or phone plus
 * password; on success the store refreshes and (optionally) navigates on.
 */
export function SignInModal({
  open,
  onClose,
  next,
}: {
  open: boolean;
  onClose: () => void;
  /** where to go after signing in; omit to stay on the current page */
  next?: string;
}) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    if (res.ok) {
      onClose();
      router.refresh();
      if (next) router.push(next);
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong — please try again.");
      setBusy(false);
    }
  };

  const registerHref = `/register?next=${encodeURIComponent(next ?? "/visualizer")}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sign in to access this feature"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* backdrop */}
      <button
        type="button"
        aria-label="Close sign in"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink/70 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-md rounded-2xl bg-white p-7 shadow-lift sm:p-9">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-mist hover:text-navy"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-green/12 text-green">
          <LockIcon />
        </span>
        <h2 className="display mt-4 text-2xl text-navy">
          Sign in to access <em className="accent-italic text-green">this feature</em>
        </h2>
        <p className="mt-2 text-sm text-muted">
          It&apos;s free — your designs, favourites and orders stay saved to your account.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="gate-identifier" className={labelCls}>Email or phone</label>
            <input
              id="gate-identifier"
              type="text"
              required
              autoFocus
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@example.ie or +353 89 000 0000"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="gate-password" className={labelCls}>Password</label>
            <input
              id="gate-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputCls}
            />
          </div>
          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
          <button type="submit" disabled={busy} className="btn btn-green w-full justify-center disabled:opacity-60">
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <p className="text-center text-sm text-muted">
            New to us?{" "}
            <Link href={registerHref} className="font-bold text-green hover:text-green-2">
              Create a free account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

/**
 * Blurs a locked visualizer mode and overlays a sign-in prompt.
 * The blurred content stays visible as a teaser of the feature.
 */
export function LockedPanel({
  featureName,
  onSignIn,
  children,
}: {
  featureName: string;
  onSignIn: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div aria-hidden="true" className="pointer-events-none select-none blur-md">
        {children}
      </div>
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-ink/55 px-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white">
          <LockIcon />
        </span>
        <p className="font-display text-xl font-bold text-white">Sign in to access</p>
        <p className="max-w-sm text-sm text-white/65">
          {featureName} is free with an Aster account — sign in to unlock it.
        </p>
        <button
          type="button"
          onClick={onSignIn}
          className="btn btn-green mt-2"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
