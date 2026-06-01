import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { sales, fmtUSD } from "@/lib/mock-data";
import { ChangeBadge, TypeBadge } from "@/components/app/Badges";
import { RelativeTime } from "@/components/app/RelativeTime";

export const Route = createFileRoute("/_app/sales")({
  component: SalesPage,
  head: () => ({ meta: [{ title: "Verified Sales — Perp RWA" }] }),
});

type Filter = "All" | "NFT" | "RWA" | "Phygital";

function SalesPage() {
  const [filter, setFilter] = useState<Filter>("All");
  const rows = sales.filter((s) => filter === "All" || s.type === filter);
  const total = rows.reduce((s, r) => s + r.price, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Verified Sales</h1>
        <p className="text-sm text-muted-foreground mt-1">Asset-level sale intelligence across category, collection, grade, source, time, and price change.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Verified sales" value={rows.length.toString()} />
        <Stat label="Verified volume" value={fmtUSD(total)} />
        <Stat label="Average sale" value={fmtUSD(total / Math.max(rows.length, 1))} />
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
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="text-left font-medium px-5 py-3">Asset</th>
              <th className="text-left font-medium px-5 py-3">Category</th>
              <th className="text-left font-medium px-5 py-3">Collection</th>
              <th className="text-left font-medium px-5 py-3">Grade</th>
              <th className="text-left font-medium px-5 py-3">Type</th>
              <th className="text-right font-medium px-5 py-3">Sale price</th>
              <th className="text-right font-medium px-5 py-3">Change</th>
              <th className="text-left font-medium px-5 py-3">Source</th>
              <th className="text-right font-medium px-5 py-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((s) => (
              <tr key={s.id} className="hover:bg-surface-raised/40 transition">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <img src={s.image} alt="" className="h-9 w-9 rounded object-cover bg-muted" />
                    <span className="font-medium">{s.asset}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{s.category}</td>
                <td className="px-5 py-3">
                  <Link to="/collections/$slug" params={{ slug: s.collectionSlug }} className="text-muted-foreground hover:text-foreground">
                    {s.collectionName}
                  </Link>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{s.grade}</td>
                <td className="px-5 py-3"><TypeBadge type={s.type} /></td>
                <td className="px-5 py-3 text-right font-mono tabular-nums font-semibold">{fmtUSD(s.price)}</td>
                <td className="px-5 py-3 text-right"><ChangeBadge value={s.priceChange} /></td>
                <td className="px-5 py-3 text-muted-foreground">{s.marketplace}</td>
                <td className="px-5 py-3 text-right text-muted-foreground text-xs"><RelativeTime iso={s.time} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
