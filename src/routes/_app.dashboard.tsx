import { createFileRoute, Link } from "@tanstack/react-router";
import { categories, collections, fmtUSD, sales } from "@/lib/mock-data";
import { ChangeBadge, TypeBadge } from "@/components/app/Badges";
import { ArrowUpRight, TrendingUp, DollarSign, Layers, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Market Overview — Perp RWA" }] }),
});

function Dashboard() {
  const totalVolume24h = collections.reduce((s, c) => s + c.volume24h, 0);
  const totalVolume7d = collections.reduce((s, c) => s + c.volume7d, 0);
  const topCategories = [...categories].sort((a, b) => b.volume24h - a.volume24h).slice(0, 4);
  const topVolume = [...collections].sort((a, b) => b.volume24h - a.volume24h).slice(0, 5);

  const stats = [
    { label: "Verified 24h Volume", value: fmtUSD(totalVolume24h), change: 6.42, icon: DollarSign },
    { label: "Verified 7d Volume", value: fmtUSD(totalVolume7d), change: 3.18, icon: TrendingUp },
    { label: "Market Categories", value: categories.length.toString(), change: 0, icon: Layers },
    { label: "Tracked Assets", value: collections.reduce((s, c) => s + c.trackedAssets, 0).toLocaleString(), change: 2.1, icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Market Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Category, collection, asset, and verified-sales intelligence for tokenized collectibles.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-semibold font-mono tabular-nums">{s.value}</span>
              {s.change !== 0 && <ChangeBadge value={s.change} />}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold">Verified sales volume — last 7 days</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Mock trend aggregated across tracked categories</p>
            </div>
            <div className="flex gap-1">
              {["24h", "7d", "30d"].map((p, i) => (
                <button key={p} className={`text-xs px-2.5 py-1 rounded ${i === 1 ? "bg-surface-raised text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{p}</button>
              ))}
            </div>
          </div>
          <ChartPlaceholder />
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="p-5 border-b border-border">
            <h2 className="text-sm font-semibold">Top categories by 24h volume</h2>
          </div>
          <div className="divide-y divide-border">
            {topCategories.map((category) => (
              <div key={category.name} className="flex items-center gap-3 p-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/20">
                  <Layers className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{category.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{category.assets.toLocaleString()} tracked assets</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold font-mono">{fmtUSD(category.volume24h)}</div>
                  <ChangeBadge value={category.change24h} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="text-sm font-semibold">Top collections by liquidity</h2>
            <Link to="/collections" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="text-left font-medium px-5 py-2">Collection</th>
                <th className="text-left font-medium px-5 py-2">Category</th>
                <th className="text-right font-medium px-5 py-2">Floor</th>
                <th className="text-right font-medium px-5 py-2">24h Vol</th>
                <th className="text-right font-medium px-5 py-2">24h</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topVolume.map((c) => (
                <tr key={c.id} className="hover:bg-surface-raised/40 transition">
                  <td className="px-5 py-3">
                    <Link to="/collections/$slug" params={{ slug: c.slug }} className="flex items-center gap-2.5">
                      <img src={c.image} alt="" className="h-7 w-7 rounded object-cover bg-muted" />
                      <span className="font-medium truncate max-w-[180px]">{c.name}</span>
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{c.category}</td>
                  <td className="text-right font-mono tabular-nums px-5 py-3">{fmtUSD(c.floorPrice)}</td>
                  <td className="text-right font-mono tabular-nums px-5 py-3">{fmtUSD(c.volume24h)}</td>
                  <td className="text-right px-5 py-3"><ChangeBadge value={c.change24h} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="text-sm font-semibold">Latest verified sales</h2>
            <Link to="/sales" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {sales.slice(0, 6).map((sale) => (
              <Link
                key={sale.id}
                to="/collections/$slug"
                params={{ slug: sale.collectionSlug }}
                className="flex items-center gap-3 p-3.5 hover:bg-surface-raised/50 transition"
              >
                <img src={sale.image} alt="" className="h-10 w-10 rounded-md object-cover bg-muted" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium truncate">{sale.asset}</span>
                    <TypeBadge type={sale.type} />
                  </div>
                  <div className="text-xs text-muted-foreground">{sale.category} · {sale.collectionName} · {sale.grade}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold font-mono tabular-nums">{fmtUSD(sale.price)}</div>
                  <div className="text-[10px] text-muted-foreground">{sale.marketplace}</div>
                </div>
                <ChangeBadge value={sale.priceChange} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartPlaceholder() {
  const points = [22, 28, 24, 32, 38, 34, 42, 39, 48, 52, 47, 58, 62, 56, 68, 72, 64, 78, 82, 76, 88];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const w = 800, h = 240, pad = 16;
  const stepX = (w - pad * 2) / (points.length - 1);
  const y = (v: number) => h - pad - ((v - min) / (max - min)) * (h - pad * 2);
  const path = points.map((v, i) => `${i === 0 ? "M" : "L"} ${pad + i * stepX} ${y(v)}`).join(" ");
  const area = `${path} L ${pad + (points.length - 1) * stepX} ${h - pad} L ${pad} ${h - pad} Z`;
  return (
    <div className="p-5">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-56" preserveAspectRatio="none">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.14 75)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="oklch(0.78 0.14 75)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((p) => (
          <line key={p} x1={pad} x2={w - pad} y1={pad + p * (h - pad * 2)} y2={pad + p * (h - pad * 2)} stroke="oklch(1 0 0 / 0.05)" strokeDasharray="2 4" />
        ))}
        <path d={area} fill="url(#g)" />
        <path d={path} fill="none" stroke="oklch(0.78 0.14 75)" strokeWidth="2" />
      </svg>
    </div>
  );
}
