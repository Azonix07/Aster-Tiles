/**
 * Server-side PostHog read-back via the HogQL Query API.
 *
 * The public `NEXT_PUBLIC_POSTHOG_KEY` (phc_…) can only *ingest* events. To read
 * data back for the admin Analytics section we need a **Personal API key**
 * (phx_…) plus the numeric Project ID — both server-only secrets. When either is
 * missing we report `configured: false` so the UI can show a setup card instead
 * of erroring.
 */

const API_HOST = (process.env.POSTHOG_API_HOST ?? "https://us.posthog.com").replace(/\/$/, "");

export function posthogConfigured(): boolean {
  return Boolean(process.env.POSTHOG_PERSONAL_API_KEY && process.env.POSTHOG_PROJECT_ID);
}

type QueryResponse = {
  results?: unknown[][];
  columns?: string[];
  error?: string;
  detail?: string;
};

/** Run one HogQL query and return rows as objects keyed by column name. */
async function hogql(query: string, signal?: AbortSignal): Promise<Record<string, unknown>[]> {
  const key = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  if (!key || !projectId) throw new Error("PostHog read-back is not configured.");

  const res = await fetch(`${API_HOST}/api/projects/${projectId}/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
    signal,
    cache: "no-store",
  });

  const data = (await res.json().catch(() => null)) as QueryResponse | null;
  if (!res.ok || !data) {
    const msg = data?.detail || data?.error || `PostHog API error (${res.status})`;
    throw new Error(msg);
  }

  const cols = data.columns ?? [];
  return (data.results ?? []).map((row) => {
    const obj: Record<string, unknown> = {};
    cols.forEach((c, i) => (obj[c] = row[i]));
    return obj;
  });
}

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const str = (v: unknown): string => (v == null ? "" : String(v));

export type AnalyticsSummary = {
  pageviews: number;
  visitors: number;
  sessions: number;
  events: number;
};
export type TrendPoint = { day: string; views: number; visitors: number };
export type NamedCount = { label: string; views: number };
export type EventCount = { event: string; count: number };

export type AnalyticsData = {
  configured: true;
  days: number;
  since: string;
  summary: AnalyticsSummary;
  trend: TrendPoint[];
  topPages: NamedCount[];
  referrers: NamedCount[];
  devices: NamedCount[];
  topEvents: EventCount[];
};

/**
 * Fetch a full analytics snapshot for the last `days` days. Runs the individual
 * HogQL queries in parallel behind a shared timeout.
 */
export async function getAnalytics(days: number): Promise<AnalyticsData> {
  // Clamp to a sane, injection-safe integer — interpolated straight into HogQL.
  const d = Math.max(1, Math.min(365, Math.round(days) || 30));
  const window = `timestamp >= now() - INTERVAL ${d} DAY`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  const sig = controller.signal;

  try {
    const [summaryRows, trendRows, pageRows, refRows, deviceRows, eventRows] = await Promise.all([
      hogql(
        `SELECT
           countIf(event = '$pageview') AS pageviews,
           count(DISTINCT if(event = '$pageview', person_id, NULL)) AS visitors,
           count(DISTINCT if(event = '$pageview', properties.$session_id, NULL)) AS sessions,
           count() AS events
         FROM events
         WHERE ${window}`,
        sig,
      ),
      hogql(
        `SELECT
           toStartOfDay(timestamp) AS day,
           countIf(event = '$pageview') AS views,
           count(DISTINCT if(event = '$pageview', person_id, NULL)) AS visitors
         FROM events
         WHERE ${window}
         GROUP BY day ORDER BY day ASC`,
        sig,
      ),
      hogql(
        `SELECT properties.$pathname AS path, count() AS views
         FROM events
         WHERE event = '$pageview' AND ${window}
         GROUP BY path ORDER BY views DESC LIMIT 12`,
        sig,
      ),
      hogql(
        `SELECT coalesce(nullIf(properties.$referring_domain, ''), '$direct') AS source, count() AS views
         FROM events
         WHERE event = '$pageview' AND ${window}
         GROUP BY source ORDER BY views DESC LIMIT 8`,
        sig,
      ),
      hogql(
        `SELECT coalesce(nullIf(properties.$device_type, ''), 'Unknown') AS device, count() AS views
         FROM events
         WHERE event = '$pageview' AND ${window}
         GROUP BY device ORDER BY views DESC`,
        sig,
      ),
      hogql(
        `SELECT event, count() AS count
         FROM events
         WHERE ${window}
         GROUP BY event ORDER BY count DESC LIMIT 8`,
        sig,
      ),
    ]);

    const s = summaryRows[0] ?? {};
    return {
      configured: true,
      days: d,
      since: new Date(Date.now() - d * 86_400_000).toISOString(),
      summary: {
        pageviews: num(s.pageviews),
        visitors: num(s.visitors),
        sessions: num(s.sessions),
        events: num(s.events),
      },
      trend: trendRows.map((r) => ({
        day: str(r.day).slice(0, 10),
        views: num(r.views),
        visitors: num(r.visitors),
      })),
      topPages: pageRows.map((r) => ({ label: str(r.path) || "/", views: num(r.views) })),
      referrers: refRows.map((r) => ({
        label: str(r.source) === "$direct" ? "Direct / none" : str(r.source),
        views: num(r.views),
      })),
      devices: deviceRows.map((r) => ({ label: str(r.device), views: num(r.views) })),
      topEvents: eventRows.map((r) => ({ event: str(r.event), count: num(r.count) })),
    };
  } finally {
    clearTimeout(timeout);
  }
}
