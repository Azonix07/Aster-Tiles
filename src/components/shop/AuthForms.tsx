"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const inputCls =
  "w-full rounded-xl border border-mist bg-off px-4 py-3 text-sm text-navy outline-none transition placeholder:text-muted/50 focus:border-green focus:ring-2 focus:ring-green/20";

const labelCls = "mb-1.5 block font-display text-xs font-bold text-navy";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      router.push(next);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong — please try again.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-lift sm:p-9">
      <p className="label text-green">Welcome back</p>
      <h1 className="display mt-2 text-2xl text-navy sm:text-3xl">
        Log in to your <em className="accent-italic text-green">account</em>
      </h1>

      <div className="mt-7 space-y-5">
        <div>
          <label htmlFor="li-email" className={labelCls}>Email</label>
          <input
            id="li-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.ie"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="li-password" className={labelCls}>Password</label>
          <input
            id="li-password"
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
          {busy ? "Logging in…" : "Log in"}
        </button>
        <p className="text-center text-sm text-muted">
          New to us?{" "}
          <Link
            href={`/register${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-bold text-green hover:text-green-2"
          >
            Create an account
          </Link>
        </p>
      </div>
    </form>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (res.ok) {
      router.push(next);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong — please try again.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-lift sm:p-9">
      <p className="label text-green">Join us</p>
      <h1 className="display mt-2 text-2xl text-navy sm:text-3xl">
        Create your <em className="accent-italic text-green">account</em>
      </h1>

      <div className="mt-7 space-y-5">
        <div>
          <label htmlFor="rg-name" className={labelCls}>Your name</label>
          <input
            id="rg-name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mary Doherty"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="rg-email" className={labelCls}>Email</label>
          <input
            id="rg-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.ie"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="rg-password" className={labelCls}>Password</label>
          <input
            id="rg-password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className={inputCls}
          />
        </div>
        {error && <p className="text-sm font-medium text-red-500">{error}</p>}
        <button type="submit" disabled={busy} className="btn btn-green w-full justify-center disabled:opacity-60">
          {busy ? "Creating account…" : "Create account"}
        </button>
        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link
            href={`/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-bold text-green hover:text-green-2"
          >
            Log in
          </Link>
        </p>
      </div>
    </form>
  );
}

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className ?? "btn btn-ghost-dark"}
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
    >
      Log out
    </button>
  );
}
