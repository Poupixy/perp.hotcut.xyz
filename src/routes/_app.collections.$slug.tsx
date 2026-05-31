import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { collections, sales, fmtUSDFull, fmtUSD, fmtTimeAgo } from "@/lib/mock-data";
import { ChangeBadge, TypeBadge } from "@/components/app/Badges";
import { ArrowLeft, Star, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_app/collections/$slug")({
  component: CollectionDetail,
  loader: ({ params }) => {
    const collection = collections.find((c) => c.slug === params.slug);
    if (!collection) throw notFound();
    return { collection };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.collection.name ?? "Collection"} — Perp RWA` }],
  }),
  notFoundComponent: () => (
    <div className="text-center py-20">
      <h2 className="text-lg font-semibold">Collection not found</h2>
      <Link to="/collections" className="mt-3 inline-block text-sm text-primary">Back to collections</Link>
    </div>
  ),
});

function CollectionDetail() {
  const { collection: c } = Route.useLoaderData();
  const collectionSales = sales.filter((s) => s.collectionSlug === c.slug);

  const stats = [
    { l: "Floor Price", v: fmtUSDFull(c.floorPrice), change: c.change24h },
    { l: "24h Volume", v: fmtUSD(c.volume24h), change: 4.2 },
    { l: "7d Volume", v: fmtUSD(c.volume7d), change: c.change7d },
    { l: "Supply", v: c.supply.toLocaleString() },
    { l: "Owners", v: c.owners.toLocaleString() },
  ];

  return (
    <div className="space-y-6">
      <Link to="/collections" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to collections
      </Link>

      <div className="flex flex-col sm:flex-row gap-5 items-start">
        <img src={c.image} alt={c.name} className="h-24 w-24 rounded-xl object-cover bg-muted ring-1 ring-border" />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <TypeBadge type={c.type} />
            <span className="text-xs text-muted-foreground">{c.series}</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{c.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Traded on <span className="text-foreground">{c.marketplace}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface text-sm hover:bg-surface-raised transition">
            <Star className="h-3.5 w-3.5" /> Watch
          </button>
          <button className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface text-sm hover:bg-surface-raised transition">
            <ExternalLink className="h-3.5 w-3.5" /> {c.marketplace}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border border border-border rounded-lg overflow-hidden">
        {stats.map((s) => (
          <div key={s.l} className="bg-card p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.l}</div>
            <div className="mt-1.5 flex items-baseline justify-between gap-2">
              <span className="text-lg font-semibold font-mono tabular-nums">{s.v}</span>
              {typeof s.change === "number" && <ChangeBadge value={s.change} />}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold">Floor price — last 30 days</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Mock data preview</p>
          </div>
          <div className="flex gap-1">
            {["7d", "30d", "90d", "All"].map((p, i) => (
              <button key={p} className={`text-xs px-2.5 py-1 rounded ${i === 1 ? "bg-surface-raised text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{p}</button>
            ))}
          </div>
        </div>
        <FloorChart seed={c.id} />
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="p-5 border-b border-border">
          <h2 className="text-sm font-semibold">Recent sales — {c.name}</h2>
        </div>
        {collectionSales.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No recent sales for this collection.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="text-left font-medium px-5 py-2">Asset</th>
                <th className="text-right font-medium px-5 py-2">Price</th>
                <th className="text-left font-medium px-5 py-2">Marketplace</th>
                <th className="text-left font-medium px-5 py-2">Buyer</th>
                <th className="text-right font-medium px-5 py-2">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {collectionSales.map((s) => (
                <tr key={s.id} className="hover:bg-surface-raised/40 transition">
                  <td className="px-5 py-3 flex items-center gap-2.5">
                    <img src={s.image} alt="" className="h-8 w-8 rounded object-cover bg-muted" />
                    <span className="font-medium">{s.asset}</span>
                  </td>
                  <td className="text-right font-mono tabular-nums font-semibold px-5 py-3">{fmtUSD(s.price)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{s.marketplace}</td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{s.buyer}</td>
                  <td className="text-right px-5 py-3 text-muted-foreground text-xs">{fmtTimeAgo(s.time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function FloorChart({ seed }: { seed: string }) {
  // Deterministic pseudo random based on seed
  const rand = (i: number) => {
    const x = Math.sin(parseInt(seed) * 9301 + i * 49297) * 233280;
    return x - Math.floor(x);
  };
  const points = Array.from({ length: 30 }, (_, i) => 50 + rand(i) * 50 + Math.sin(i / 3) * 10);
  const max = Math.max(...points), min = Math.min(...points);
  const w = 800, h = 240, pad = 16;
  const stepX = (w - pad * 2) / (points.length - 1);
  const y = (v: number) => h - pad - ((v - min) / (max - min)) * (h - pad * 2);
  const path = points.map((v, i) => `${i === 0 ? "M" : "L"} ${pad + i * stepX} ${y(v)}`).join(" ");
  const area = `${path} L ${pad + (points.length - 1) * stepX} ${h - pad} L ${pad} ${h - pad} Z`;
  return (
    <div className="p-5">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-56" preserveAspectRatio="none">
        <defs>
          <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.14 75)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="oklch(0.78 0.14 75)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((p) => (
          <line key={p} x1={pad} x2={w - pad} y1={pad + p * (h - pad * 2)} y2={pad + p * (h - pad * 2)} stroke="oklch(1 0 0 / 0.05)" strokeDasharray="2 4" />
        ))}
        <path d={area} fill="url(#cg)" />
        <path d={path} fill="none" stroke="oklch(0.78 0.14 75)" strokeWidth="2" />
      </svg>
    </div>
  );
}
