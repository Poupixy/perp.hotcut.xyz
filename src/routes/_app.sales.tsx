import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { fmtUSD } from "@/lib/mock-data";
import { TypeBadge } from "@/components/app/Badges";
import { RelativeTime } from "@/components/app/RelativeTime";
import { useMarketSales } from "@/lib/market-data/use-market-sales";
import type { NormalizedSale } from "@/lib/market-data/types";

export const Route = createFileRoute("/_app/sales")({
  component: SalesPage,
  head: () => ({ meta: [{ title: "Verified Sales — Perp RWA" }] }),
});

type Filter = "All" | "NFT" | "RWA" | "Phygital";

function SalesPage() {
  const [filter, setFilter] = useState<Filter>("All");
  const { data, loading, error } = useMarketSales(7);
  const allRows = data?.sales ?? [];
  const rows = allRows.filter((sale) => filter === "All" || saleType(sale) === filter);
  const usdRows = rows.filter((sale) => sale.currency === "USD");
  const total = usdRows.reduce((sum, sale) => sum + sale.salePrice, 0);
  const average = usdRows.length ? total / usdRows.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Verified Sales</h1>
        <p className="text-sm text-muted-foreground mt-1">7-day asset-level sales across tracked markets, with provider, marketplace, timestamp, and source status.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="7d sales" value={loading ? "..." : rows.length.toString()} />
        <Stat label="USD volume" value={loading ? "..." : fmtUSD(total)} />
        <Stat label="Average USD sale" value={loading ? "..." : fmtUSD(average)} />
      </div>

      <DataStatus data={data} error={error} loading={loading} />

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
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="text-left font-medium px-5 py-3">Asset</th>
              <th className="text-left font-medium px-5 py-3">Market</th>
              <th className="text-left font-medium px-5 py-3">Grade</th>
              <th className="text-left font-medium px-5 py-3">Type</th>
              <th className="text-right font-medium px-5 py-3">Sale price</th>
              <th className="text-right font-medium px-5 py-3">Provider</th>
              <th className="text-left font-medium px-5 py-3">Marketplace</th>
              <th className="text-right font-medium px-5 py-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((s) => (
              <tr key={s.id} className="hover:bg-surface-raised/40 transition">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    {s.assetImage ? <img src={s.assetImage} alt="" className="h-9 w-9 rounded object-cover bg-muted" /> : <div className="h-9 w-9 rounded bg-muted" />}
                    <span className="font-medium">{s.assetName}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{s.marketName}</td>
                <td className="px-5 py-3 text-muted-foreground">{s.grade ?? "Verified"}</td>
                <td className="px-5 py-3"><TypeBadge type={saleType(s)} /></td>
                <td className="px-5 py-3 text-right font-mono tabular-nums font-semibold">{formatSalePrice(s)}</td>
                <td className="px-5 py-3 text-right text-muted-foreground">{s.source}</td>
                <td className="px-5 py-3 text-muted-foreground">{s.marketplace}</td>
                <td className="px-5 py-3 text-right text-muted-foreground text-xs"><RelativeTime iso={s.saleTime} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function saleType(sale: NormalizedSale): "NFT" | "RWA" | "Phygital" {
  if (["nba-topshot-rare", "nfl-all-day", "nhl-topshot", "nba-cards", "nfl-cards", "nhl-cards"].includes(sale.marketSlug)) return "NFT";
  return "Phygital";
}

function formatSalePrice(sale: NormalizedSale): string {
  if (sale.currency === "USD") return fmtUSD(sale.salePrice);
  return `${sale.salePrice.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${sale.currency}`;
}

function DataStatus({ data, error, loading }: { data: ReturnType<typeof useMarketSales>["data"]; error?: string; loading: boolean }) {
  if (loading) return <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">Loading 7-day market sales...</div>;
  if (error) return <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">Market sales endpoint failed: {error}</div>;
  if (!data) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className={`h-2 w-2 rounded-full ${data.live ? "bg-success" : "bg-muted-foreground"}`} />
            {data.live ? "Live sales feed active" : "Waiting for live provider configuration"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Window: {new Date(data.from).toLocaleDateString()} - {new Date(data.to).toLocaleDateString()}</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {data.providerStatus.map((provider) => (
            <ProviderPill key={provider.provider} provider={provider} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProviderPill({ provider }: { provider: NonNullable<ReturnType<typeof useMarketSales>["data"]>["providerStatus"][number] }) {
  const state = provider.ok ? "Live" : provider.enabled ? "Configured" : "Not configured";
  const dotClass = provider.ok ? "bg-success" : provider.enabled ? "bg-primary" : "bg-muted-foreground";
  const shellClass = provider.ok
    ? "border-success/30 bg-success/10 text-success"
    : provider.enabled
      ? "border-primary/30 bg-primary/10 text-primary"
      : "border-border bg-surface text-muted-foreground";

  return (
    <span className={`inline-flex min-w-[128px] items-center justify-between gap-2 rounded border px-2.5 py-1.5 text-[11px] ${shellClass}`} title={provider.message}>
      <span className="inline-flex items-center gap-1.5 truncate">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
        <span className="truncate">{provider.provider}</span>
      </span>
      <span className="font-medium">{state}</span>
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1.5 text-2xl font-semibold font-mono tabular-nums">{value}</div>
    </div>
  );
}
