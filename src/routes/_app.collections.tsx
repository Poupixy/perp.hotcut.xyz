import { createFileRoute, Link } from "@tanstack/react-router";
import { realMarketCategories, fmtCount } from "@/lib/real-market-data";
import { categoryIcon } from "@/components/app/categoryIcons";

export const Route = createFileRoute("/_app/collections")({
  component: CollectionsPage,
  head: () => ({ meta: [{ title: "Markets — Perp RWA" }] }),
});

function CollectionsPage() {
  const filtered = realMarketCategories;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Markets</h1>
        <p className="text-sm text-muted-foreground mt-1">Top-level collectible markets with asset coverage, liquidity, and verified sale signals.</p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">Filtered to the approved collectible markets only.</div>
        <div className="text-xs text-muted-foreground font-mono">{filtered.length} markets</div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="text-left font-medium px-5 py-3 w-10">#</th>
              <th className="text-left font-medium px-5 py-3">Market</th>
              <th className="text-right font-medium px-5 py-3">Total NFTs</th>
              <th className="text-right font-medium px-5 py-3">Collector Crypt</th>
              <th className="text-right font-medium px-5 py-3">Phygitals</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((c, i) => (
              <tr key={c.slug} className="hover:bg-surface-raised/40 transition group">
                <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">{i + 1}</td>
                <td className="px-5 py-3.5">
                  <Link to="/collections/$slug" params={{ slug: c.slug }} className="flex items-center gap-3">
                    {categoryIcon(c.slug) ? (
                      <img src={categoryIcon(c.slug) ?? ""} alt="" className="h-9 w-9 rounded-md object-contain bg-primary/10 ring-1 ring-primary/20 p-1" />) : (<div className="h-9 w-9 rounded-md bg-primary/10 ring-1 ring-primary/20" />)}
                    <div>
                      <div className="font-medium group-hover:text-primary transition">{c.name}</div>
                      <div className="text-xs text-muted-foreground">Collector Crypt + Phygitals</div>
                    </div>
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums font-semibold">{fmtCount(c.assets)}</td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums text-muted-foreground">{fmtCount(c.collectorCryptAssets)}</td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums text-muted-foreground">{fmtCount(c.phygitalsAssets)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
