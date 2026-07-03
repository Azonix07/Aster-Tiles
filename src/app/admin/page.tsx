import Link from "next/link";
import { getDb } from "@/lib/db";
import { money, shortDate } from "@/lib/format";
import { StatusBadge } from "@/components/shop/OrderBits";
import { effectivePrice, hasDiscount } from "@/lib/pricing";

/* ── Inline SVG icons ─────────────────────────── */

function ArrowUpRight({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7M7 7h10v10" />
    </svg>
  );
}

function TrendUp() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16Z" />
      <path d="M3.3 7l8.7 5 8.7-5M12 22V12" />
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

function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 12h18M12 3v18" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

/* ── Dashboard ────────────────────────────────── */

export default function AdminDashboard() {
  const db = getDb();
  const orders = [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const active = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const delivered = orders.filter((o) => o.status === "delivered");
  const cancelled = orders.filter((o) => o.status === "cancelled");
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);
  const customers = db.users.filter((u) => !u.isAdmin).length;
  const outOfStock = db.tiles.filter((t) => !t.inStock).length;
  const onSale = db.tiles.filter((t) => hasDiscount(t)).length;
  const symbol = db.settings.currencySymbol;
  const m = db.settings.maintenance;

  /* Average order value */
  const completedOrders = orders.filter((o) => o.status !== "cancelled");
  const avgOrder = completedOrders.length > 0
    ? Math.round(revenue / completedOrders.length * 100) / 100
    : 0;

  /* Top selling tiles (by how many orders include them) */
  const tileSales = new Map<string, number>();
  for (const order of orders) {
    if (order.status === "cancelled") continue;
    for (const item of order.items) {
      tileSales.set(item.tileId, (tileSales.get(item.tileId) || 0) + item.sqm);
    }
  }
  const topTiles = [...tileSales.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tileId, sqm]) => {
      const tile = db.tiles.find((t) => t.id === tileId);
      return { tileId, name: tile?.name ?? tileId, sqm, texture: tile?.texture };
    });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{greeting}</p>
          <h1 className="display mt-1 text-3xl text-navy">Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/tiles/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-green px-4 py-2.5 font-display text-xs font-bold text-white shadow-sm transition hover:bg-green-2"
          >
            <PlusIcon />
            Add tile
          </Link>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 rounded-xl border border-mist bg-white px-4 py-2.5 font-display text-xs font-bold text-navy shadow-sm transition hover:border-green hover:text-green"
          >
            View orders
            <ArrowUpRight />
          </Link>
        </div>
      </div>

      {/* Maintenance banner */}
      {(m.fullSite || m.payments) && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-300/50 bg-amber-50 px-5 py-4">
          <span className="mt-0.5 text-amber-600"><AlertIcon /></span>
          <div>
            <p className="font-display text-sm font-bold text-amber-900">
              {m.fullSite ? "Site is in maintenance mode" : "Payments are paused"}
            </p>
            <p className="mt-1 text-xs text-amber-700/80">
              Visitors {m.fullSite ? "see the maintenance page" : "can browse but cannot place orders"}.{" "}
              <Link href="/admin/settings" className="font-bold text-amber-900 underline underline-offset-2 hover:text-green">
                Update settings
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          {
            label: "Total Revenue",
            value: money(revenue, symbol),
            icon: <DollarIcon />,
            iconBg: "bg-emerald-50 text-emerald-600",
            href: "/admin/orders",
          },
          {
            label: "Orders",
            value: String(orders.length),
            icon: <PackageIcon />,
            iconBg: "bg-blue-50 text-blue-600",
            href: "/admin/orders",
          },
          {
            label: "Needs Attention",
            value: String(active.length),
            icon: <AlertIcon />,
            iconBg: active.length > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400",
            href: "/admin/orders",
            accent: active.length > 0,
          },
          {
            label: "Avg. Order",
            value: money(avgOrder, symbol),
            icon: <TrendUp />,
            iconBg: "bg-violet-50 text-violet-600",
            href: "/admin/orders",
          },
          {
            label: "Customers",
            value: String(customers),
            icon: <UsersIcon />,
            iconBg: "bg-cyan-50 text-cyan-600",
            href: "/admin/orders",
          },
          {
            label: "Catalogue",
            value: String(db.tiles.length),
            icon: <GridIcon />,
            iconBg: "bg-rose-50 text-rose-500",
            href: "/admin/tiles",
            sub: outOfStock > 0 ? `${outOfStock} out of stock` : onSale > 0 ? `${onSale} on sale` : undefined,
          },
        ].map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-lift ${
              c.accent ? "border-amber-300/60" : "border-mist"
            }`}
          >
            <div className={`mb-3 inline-flex items-center justify-center rounded-xl p-2.5 ${c.iconBg}`}>
              {c.icon}
            </div>
            <p className="text-[0.65rem] font-bold tracking-wide text-muted uppercase">{c.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-navy">{c.value}</p>
            {c.sub && (
              <p className={`mt-1 text-[0.62rem] font-semibold ${c.accent ? "text-amber-600" : "text-muted"}`}>
                {c.sub}
              </p>
            )}
            <ArrowUpRight className="absolute top-4 right-4 text-mist transition-colors group-hover:text-green" />
          </Link>
        ))}
      </div>

      {/* Two-column: Orders table + Stats sidebar */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Latest orders */}
        <div className="rounded-2xl border border-mist bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-navy">Recent Orders</h2>
            <Link href="/admin/orders" className="inline-flex items-center gap-1 text-xs font-bold text-green hover:text-green-2">
              View all <ArrowUpRight />
            </Link>
          </div>
          {orders.length === 0 ? (
            <div className="mt-8 flex flex-col items-center py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mist/60 text-muted">
                <PackageIcon />
              </div>
              <p className="mt-4 text-sm font-medium text-muted">No orders yet</p>
              <p className="mt-1 text-xs text-muted/70">
                Orders will appear here when customers check out.
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-mist text-[0.65rem] tracking-wider text-muted uppercase">
                    <th className="py-2.5 pr-4 font-bold">Order</th>
                    <th className="py-2.5 pr-4 font-bold">Customer</th>
                    <th className="py-2.5 pr-4 font-bold">Date</th>
                    <th className="py-2.5 pr-4 font-bold">Total</th>
                    <th className="py-2.5 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 8).map((o) => (
                    <tr key={o.id} className="border-b border-mist/50 transition last:border-0 hover:bg-off/60">
                      <td className="py-3.5 pr-4">
                        <Link href={`/admin/orders/${o.id}`} className="font-bold text-navy hover:text-green">
                          {o.number}
                        </Link>
                      </td>
                      <td className="py-3.5 pr-4 text-muted">{o.customerName}</td>
                      <td className="py-3.5 pr-4 text-muted">{shortDate(o.createdAt)}</td>
                      <td className="py-3.5 pr-4 font-bold text-navy">{money(o.total, o.currencySymbol)}</td>
                      <td className="py-3.5">
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right sidebar: stats + quick actions */}
        <div className="flex flex-col gap-6">
          {/* Order breakdown */}
          <div className="rounded-2xl border border-mist bg-white p-5 shadow-sm">
            <h3 className="font-display text-sm font-bold text-navy">Order Breakdown</h3>
            <div className="mt-4 space-y-3">
              {[
                { label: "Active", count: active.length, color: "bg-blue-500" },
                { label: "Delivered", count: delivered.length, color: "bg-emerald-500" },
                { label: "Cancelled", count: cancelled.length, color: "bg-red-400" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                    <span className="text-muted">{s.label}</span>
                  </div>
                  <span className="font-display font-bold text-navy">{s.count}</span>
                </div>
              ))}
              {/* Simple bar */}
              {orders.length > 0 && (
                <div className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full bg-mist/50">
                  {active.length > 0 && (
                    <div
                      className="bg-blue-500 transition-all"
                      style={{ width: `${(active.length / orders.length) * 100}%` }}
                    />
                  )}
                  {delivered.length > 0 && (
                    <div
                      className="bg-emerald-500 transition-all"
                      style={{ width: `${(delivered.length / orders.length) * 100}%` }}
                    />
                  )}
                  {cancelled.length > 0 && (
                    <div
                      className="bg-red-400 transition-all"
                      style={{ width: `${(cancelled.length / orders.length) * 100}%` }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Top selling tiles */}
          <div className="rounded-2xl border border-mist bg-white p-5 shadow-sm">
            <h3 className="font-display text-sm font-bold text-navy">Top Sellers</h3>
            {topTiles.length === 0 ? (
              <p className="mt-3 text-xs text-muted">Sales data will appear after orders.</p>
            ) : (
              <div className="mt-3 space-y-2.5">
                {topTiles.map((t, i) => (
                  <Link
                    key={t.tileId}
                    href={`/admin/tiles/${t.tileId}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-off"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-mist/60 text-[0.6rem] font-bold text-muted">
                      {i + 1}
                    </span>
                    {t.texture && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.texture} alt="" className="h-8 w-8 rounded-md object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-navy">{t.name}</p>
                      <p className="text-[0.6rem] text-muted">{t.sqm.toFixed(1)} m² sold</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border border-mist bg-white p-5 shadow-sm">
            <h3 className="font-display text-sm font-bold text-navy">Quick Actions</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { label: "Add tile", href: "/admin/tiles/new", icon: <PlusIcon /> },
                { label: "Edit content", href: "/admin/content", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> },
                { label: "All orders", href: "/admin/orders", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
                { label: "Settings", href: "/admin/settings", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
              ].map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className="flex items-center gap-2 rounded-xl border border-mist bg-off px-3 py-2.5 text-xs font-semibold text-navy transition hover:border-green hover:text-green"
                >
                  {a.icon}
                  {a.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Inventory alerts */}
          {(outOfStock > 0 || onSale > 0) && (
            <div className="rounded-2xl border border-mist bg-white p-5 shadow-sm">
              <h3 className="font-display text-sm font-bold text-navy">Inventory</h3>
              <div className="mt-3 space-y-2">
                {outOfStock > 0 && (
                  <div className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2">
                    <span className="text-xs font-medium text-red-700">Out of stock</span>
                    <span className="font-display text-sm font-bold text-red-600">{outOfStock}</span>
                  </div>
                )}
                {onSale > 0 && (
                  <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                    <span className="text-xs font-medium text-emerald-700">On sale</span>
                    <span className="font-display text-sm font-bold text-emerald-600">{onSale}</span>
                  </div>
                )}
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-xs font-medium text-slate-600">Total tiles</span>
                  <span className="font-display text-sm font-bold text-navy">{db.tiles.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
