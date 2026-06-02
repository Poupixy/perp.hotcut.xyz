import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { categories, collections, fmtUSD } from "@/lib/mock-data";
import { ChangeBadge, TypeBadge } from "@/components/app/Badges";
import { ArrowUpDown } from "lucide-react";

export const Route = createFileRoute("/_app/collections")({
  component: CollectionsPage,
  head: () => ({ meta: [{ title: "Markets — Perp RWA" }] }),
});

type Filter = "All" | "NFT" | "RWA" | "Phygital";

function CollectionsPage() {
  const [filter, setFilter] = useState<Filter>("All");
  const filtered = collections.filter((c) => filter === "All" || c.type === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Markets</h1>
        <p className="text-sm text-muted-foreground mt-1">Top-level collectible markets with asset coverage, liquidity, and verified sale signals.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {categories.map((category) => (
          <div key={category.name} className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm font-semibold">{category.name}</div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground">Assets</div>
                <div className="mt-0.5 font-mono">{category.assets.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground">24h Vol</div>
                <div className="mt-0.5 font-mono">{fmtUSD(category.volume24h)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 p-1 rounded-md bg-surface border border-border">
          {(["All", "NFT", "RWA", "Phygital"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded transition ${filter === f ? "bg-surface-raised text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground font-mono">{filtered.length} markets</div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="text-left font-medium px-5 py-3 w-10">#</th>
              <th className="text-left font-medium px-5 py-3">Market</th>
              <th className="text-left font-medium px-5 py-3">Category</th>
              <th className="text-left font-medium px-5 py-3">Type</th>
              <th className="text-right font-medium px-5 py-3">Assets</th>
              <th className="text-right font-medium px-5 py-3">
                <button className="inline-flex items-center gap-1 hover:text-foreground">Floor <ArrowUpDown className="h-3 w-3" /></button>
              </th>
              <th className="text-right font-medium px-5 py-3">24h</th>
              <th className="text-right font-medium px-5 py-3">7d</th>
              <th className="text-right font-medium px-5 py-3">24h Vol</th>
              <th className="text-right font-medium px-5 py-3">7d Vol</th>
              <th className="text-right font-medium px-5 py-3">Owners</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((c, i) => (
              <tr key={c.id} className="hover:bg-surface-raised/40 transition group">
                <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">{i + 1}</td>
                <td className="px-5 py-3.5">
                  <Link to="/collections/$slug" params={{ slug: c.slug }} className="flex items-center gap-3">
                    <img src={c.image} alt="" className="h-9 w-9 rounded-md object-cover bg-muted" />
                    <div>
                      <div className="font-medium group-hover:text-primary transition">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.series} · {c.marketplace}</div>
                    </div>
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-muted-foreground">{c.category}</td>
                <td className="px-5 py-3.5"><TypeBadge type={c.type} /></td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums text-muted-foreground">{c.trackedAssets.toLocaleString()}</td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums">{fmtUSD(c.floorPrice)}</td>
                <td className="px-5 py-3.5 text-right"><ChangeBadge value={c.change24h} /></td>
                <td className="px-5 py-3.5 text-right"><ChangeBadge value={c.change7d} /></td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums">{fmtUSD(c.volume24h)}</td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums">{fmtUSD(c.volume7d)}</td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums text-muted-foreground">{c.owners.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
