"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AnalyticsData,
  NamedCount,
  EventCount,
  TrendPoint,
} from "@/lib/posthog";

/* ── Icons ────────────────────────────────────── */

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
function SessionIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}
function PulseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
function RefreshIcon({ spinning }: { spinning?: boolean }) {
  return (
    <svg className={spinning ? "animate-spin" : ""} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 4v6h-6M1 20v-6h6" />
      <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
    </svg>
  );
}
function ExternalIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <path d="M15 3h6v6M10 14L21 3" />
    </svg>
  );
}

/* ── Types ────────────────────────────────────── */

type ApiState =
  | { status: "loading" }
  | { status: "unconfigured" }
  | { status: "error"; message: string }
  | { status: "ready"; data: AnalyticsData };

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

const nf = new Intl.NumberFormat("en-IE");

/* ── Component ────────────────────────────────── */

export default function AnalyticsDashboard() {
  const [days, setDays] = useState(30);
  const [state, setState] = useState<ApiState>({ status: "loading" });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (range: number, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setState({ status: "loading" });
    try {
      const res = await fetch(`/api/admin/analytics?days=${range}`, { cache: "no-store" });
      const body = await res.json();
      if (body?.configured === false) {
        setState({ status: "unconfigured" });
      } else if (!res.ok || body?.error) {
        setState({ status: "error", message: body?.error ?? `Request failed (${res.status})` });
      } else {
        setState({ status: "ready", data: body as AnalyticsData });
      }
    } catch {
      setState({ status: "error", message: "Could not reach the analytics API." });
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Fetch-on-mount / on-range-change. load() sets a loading state before the
    // async request; that synchronous setState is intentional here (the component
    // also initialises to "loading"), so this rule is a false positive.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(days);
  }, [days, load]);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Product analytics · PostHog</p>
          <h1 className="display mt-1 text-3xl text-navy">Analytics</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-mist bg-white p-1 shadow-sm">
            {RANGES.map((r) => (
              <button
                key={r.days}
                onClick={() => setDays(r.days)}
                className={`rounded-lg px-3 py-1.5 font-display text-xs font-bold transition ${
                  days === r.days ? "bg-green text-white shadow-sm" : "text-muted hover:text-navy"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => load(days, true)}
            disabled={refreshing || state.status === "loading"}
            className="inline-flex items-center gap-1.5 rounded-xl border border-mist bg-white px-3 py-2.5 font-display text-xs font-bold text-navy shadow-sm transition hover:border-green hover:text-green disabled:opacity-50"
            title="Refresh"
          >
            <RefreshIcon spinning={refreshing} />
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-8">
        {state.status === "loading" && <SkeletonView />}
        {state.status === "unconfigured" && <SetupCard />}
        {state.status === "error" && <ErrorCard message={state.message} onRetry={() => load(days)} />}
        {state.status === "ready" && <ReadyView data={state.data} />}
      </div>
    </div>
  );
}

/* ── Ready view ───────────────────────────────── */

function ReadyView({ data }: { data: AnalyticsData }) {
  const perVisitor = data.summary.visitors > 0
    ? (data.summary.pageviews / data.summary.visitors).toFixed(1)
    : "—";
  const empty = data.summary.events === 0;

  return (
    <div className="space-y-6">
      {empty && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
          <span className="mt-0.5 text-blue-500"><PulseIcon /></span>
          <div>
            <p className="font-display text-sm font-bold text-blue-900">No events in this window yet</p>
            <p className="mt-1 text-xs text-blue-700/80">
              Capture is live — browse the storefront in another tab and data will show here within a
              minute or two. New PostHog projects can also take a few minutes to start reporting.
            </p>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Unique visitors" value={nf.format(data.summary.visitors)} icon={<UsersIcon />} iconBg="bg-cyan-50 text-cyan-600" />
        <KpiCard label="Pageviews" value={nf.format(data.summary.pageviews)} icon={<EyeIcon />} iconBg="bg-emerald-50 text-emerald-600" sub={`${perVisitor} per visitor`} />
        <KpiCard label="Sessions" value={nf.format(data.summary.sessions)} icon={<SessionIcon />} iconBg="bg-violet-50 text-violet-600" />
        <KpiCard label="Total events" value={nf.format(data.summary.events)} icon={<PulseIcon />} iconBg="bg-amber-50 text-amber-600" />
      </div>

      {/* Trend chart */}
      <div className="rounded-2xl border border-mist bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-navy">Traffic over time</h2>
          <div className="flex items-center gap-4 text-[0.65rem] font-semibold text-muted">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-green" />Pageviews</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-navy/25" />Visitors</span>
          </div>
        </div>
        <TrendChart points={data.trend} />
      </div>

      {/* Two columns: top pages + referrers/devices */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 rounded-2xl border border-mist bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-navy">Top pages</h2>
          <BarList items={data.topPages} empty="No pageviews recorded yet." mono />
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-mist bg-white p-5 shadow-sm">
            <h3 className="font-display text-sm font-bold text-navy">Top referrers</h3>
            <BarList items={data.referrers} empty="No referrers yet." compact />
          </div>
          <div className="rounded-2xl border border-mist bg-white p-5 shadow-sm">
            <h3 className="font-display text-sm font-bold text-navy">Devices</h3>
            <BarList items={data.devices} empty="No device data yet." compact />
          </div>
        </div>
      </div>

      {/* Top events */}
      <div className="rounded-2xl border border-mist bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-bold text-navy">Top events</h2>
        <EventList items={data.topEvents} />
      </div>

      <p className="text-center text-[0.65rem] text-muted">
        Last {data.days} days · data from PostHog. Open the{" "}
        <a href="https://us.posthog.com" target="_blank" rel="noreferrer" className="font-semibold text-green hover:underline">
          full PostHog dashboard
        </a>{" "}
        for funnels, session replays and more.
      </p>
    </div>
  );
}

function KpiCard({ label, value, icon, iconBg, sub }: { label: string; value: string; icon: React.ReactNode; iconBg: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-mist bg-white p-5 shadow-sm">
      <div className={`mb-3 inline-flex items-center justify-center rounded-xl p-2.5 ${iconBg}`}>{icon}</div>
      <p className="text-[0.65rem] font-bold tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-navy">{value}</p>
      {sub && <p className="mt-1 text-[0.62rem] font-semibold text-muted">{sub}</p>}
    </div>
  );
}

function TrendChart({ points }: { points: TrendPoint[] }) {
  if (points.length === 0) {
    return <p className="mt-6 py-8 text-center text-sm text-muted">No traffic in this window yet.</p>;
  }
  const max = Math.max(1, ...points.map((p) => p.views));
  // Thin the x-axis labels so they never collide.
  const step = Math.ceil(points.length / 8);

  return (
    <div className="mt-6">
      <div className="flex h-48 items-end gap-[3px]">
        {points.map((p) => {
          const viewH = (p.views / max) * 100;
          const visH = (p.visitors / max) * 100;
          return (
            <div
              key={p.day}
              className="group relative flex flex-1 items-end justify-center"
              style={{ height: "100%" }}
            >
              {/* pageviews bar */}
              <div className="flex w-full max-w-[26px] items-end justify-center rounded-t-sm bg-green/85 transition group-hover:bg-green" style={{ height: `${Math.max(viewH, p.views > 0 ? 2 : 0)}%` }} />
              {/* visitors overlay */}
              <div className="absolute bottom-0 w-full max-w-[26px] rounded-t-sm bg-navy/20" style={{ height: `${Math.max(visH, p.visitors > 0 ? 2 : 0)}%` }} />
              {/* tooltip */}
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-center whitespace-nowrap text-white shadow-lg group-hover:block">
                <p className="text-[0.6rem] font-bold">{fmtDay(p.day)}</p>
                <p className="text-[0.6rem] text-green">{nf.format(p.views)} views</p>
                <p className="text-[0.6rem] text-white/60">{nf.format(p.visitors)} visitors</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[0.6rem] text-muted">
        {points.filter((_, i) => i % step === 0).map((p) => (
          <span key={p.day}>{fmtDay(p.day)}</span>
        ))}
      </div>
    </div>
  );
}

function BarList({ items, empty, mono, compact }: { items: NamedCount[]; empty: string; mono?: boolean; compact?: boolean }) {
  if (items.length === 0) {
    return <p className={`${compact ? "mt-3" : "mt-4"} text-xs text-muted`}>{empty}</p>;
  }
  const max = Math.max(1, ...items.map((i) => i.views));
  return (
    <div className={`${compact ? "mt-3 space-y-2" : "mt-4 space-y-2.5"}`}>
      {items.map((i) => (
        <div key={i.label} className="relative overflow-hidden rounded-lg">
          <div className="absolute inset-y-0 left-0 rounded-lg bg-green/10" style={{ width: `${(i.views / max) * 100}%` }} />
          <div className="relative flex items-center justify-between gap-3 px-3 py-2">
            <span className={`min-w-0 flex-1 truncate text-xs ${mono ? "font-mono" : "font-medium"} text-navy`} title={i.label}>
              {i.label}
            </span>
            <span className="font-display text-xs font-bold text-navy">{nf.format(i.views)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function EventList({ items }: { items: EventCount[] }) {
  if (items.length === 0) {
    return <p className="mt-4 text-xs text-muted">No events recorded yet.</p>;
  }
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {items.map((e) => (
        <div key={e.event} className="flex items-center gap-2 rounded-xl border border-mist bg-off px-3 py-2">
          <code className="text-xs font-semibold text-navy">{e.event}</code>
          <span className="rounded-md bg-green/12 px-1.5 py-0.5 font-display text-[0.65rem] font-bold text-green">
            {nf.format(e.count)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Loading / error / setup states ───────────── */

function SkeletonView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl border border-mist bg-white" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl border border-mist bg-white" />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="h-64 animate-pulse rounded-2xl border border-mist bg-white" />
        <div className="h-64 animate-pulse rounded-2xl border border-mist bg-white" />
      </div>
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
      <h2 className="font-display text-lg font-bold text-red-900">Couldn&apos;t load analytics</h2>
      <p className="mt-2 max-w-xl text-sm text-red-700/90">{message}</p>
      <p className="mt-2 text-xs text-red-700/70">
        Check that <code className="font-mono">POSTHOG_PERSONAL_API_KEY</code>,{" "}
        <code className="font-mono">POSTHOG_PROJECT_ID</code> and{" "}
        <code className="font-mono">POSTHOG_API_HOST</code> are correct in{" "}
        <code className="font-mono">.env.local</code>, then restart the dev server.
      </p>
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 font-display text-xs font-bold text-white transition hover:bg-red-700"
      >
        <RefreshIcon /> Try again
      </button>
    </div>
  );
}

function SetupCard() {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-mist bg-white p-8 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green/12 text-green">
          <PulseIcon />
        </span>
        <div>
          <h2 className="font-display text-xl font-bold text-navy">Finish connecting PostHog</h2>
          <p className="text-sm text-muted">Capture is live — one more step to read the data back here.</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-green/20 bg-green/5 px-4 py-3 text-xs text-navy/80">
        The public key already sends events to PostHog. Reading them into this dashboard needs a
        server-side <strong>Personal API key</strong> — it stays on the server and is never exposed
        to visitors.
      </div>

      <ol className="mt-6 space-y-4">
        <Step n={1} title="Create a Personal API key">
          In PostHog go to <strong>Settings → Personal API keys → Create key</strong>. Give it the
          scopes <code className="rounded bg-off px-1 font-mono">Query: Read</code> and{" "}
          <code className="rounded bg-off px-1 font-mono">Insight: Read</code>. It starts with{" "}
          <code className="rounded bg-off px-1 font-mono">phx_</code>.
        </Step>
        <Step n={2} title="Grab your Project ID">
          <strong>Settings → Project</strong> shows a numeric <em>Project ID</em> (e.g.{" "}
          <code className="rounded bg-off px-1 font-mono">12345</code>).
        </Step>
        <Step n={3} title="Add both to .env.local">
          <pre className="mt-1 overflow-x-auto rounded-lg bg-ink p-3 text-[0.7rem] leading-relaxed text-white/90">
{`POSTHOG_PERSONAL_API_KEY=phx_xxxxxxxx
POSTHOG_PROJECT_ID=12345
POSTHOG_API_HOST=https://us.posthog.com`}
          </pre>
          <span className="mt-1 block text-[0.7rem] text-muted">
            Use <code className="font-mono">https://eu.posthog.com</code> if your project is on EU cloud.
          </span>
        </Step>
        <Step n={4} title="Restart the dev server" last>
          Env changes only apply on restart. Then reload this page.
        </Step>
      </ol>

      <a
        href="https://us.posthog.com/settings/user-api-keys"
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-green px-4 py-2.5 font-display text-xs font-bold text-white shadow-sm transition hover:bg-green-2"
      >
        Open PostHog settings <ExternalIcon />
      </a>
    </div>
  );
}

function Step({ n, title, children, last }: { n: number; title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <li className="relative flex gap-4">
      {!last && <span className="absolute top-8 left-[15px] h-full w-px bg-mist" />}
      <span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green/12 font-display text-sm font-bold text-green">
        {n}
      </span>
      <div className="pb-1">
        <p className="font-display text-sm font-bold text-navy">{title}</p>
        <div className="mt-1 text-xs leading-relaxed text-muted">{children}</div>
      </div>
    </li>
  );
}

/* ── utils ────────────────────────────────────── */

function fmtDay(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IE", { day: "numeric", month: "short" });
}
