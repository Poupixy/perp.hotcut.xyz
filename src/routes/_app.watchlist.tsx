import { createFileRoute, Link } from "@tanstack/react-router";
import { collections, watchlist, fmtUSD } from "@/lib/mock-data";
import { ChangeBadge, TypeBadge } from "@/components/app/Badges";
import { Star, StarOff } from "lucide-react";

export const Route = createFileRoute("/_app/watchlist")({
  component: WatchlistPage,
  head: () => ({ meta: [{ title: "Watchlist — Perp RWA" }] }),
});

function WatchlistPage() {
  const watched = collections.filter((c) => watchlist.includes(c.slug));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Watchlist</h1>
          <p className="text-sm text-muted-foreground mt-1">Collections selected for closer market-intelligence monitoring.</p>
        </div>
        <div className="text-xs text-muted-foreground font-mono">{watched.length} watched</div>
      </div>

      {watched.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/30 p-16 text-center">
          <Star className="h-8 w-8 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-sm font-semibold">No collections watched</h3>
          <p className="mt-1 text-sm text-muted-foreground">Star collections to track them here.</p>
          <Link to="/collections" className="mt-5 inline-flex items-center justify-center h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition">
            Browse collections
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {watched.map((c) => (
            <Link
              key={c.id}
              to="/collections/$slug"
              params={{ slug: c.slug }}
              className="group rounded-lg border border-border bg-card overflow-hidden hover:border-primary/40 transition"
            >
              <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                <img src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3"><TypeBadge type={c.type} /></div>
                <button className="absolute top-3 right-3 h-8 w-8 inline-flex items-center justify-center rounded-md bg-background/80 backdrop-blur border border-border text-primary">
                  <StarOff className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="p-4">
                <div className="text-xs text-muted-foreground">{c.category} · {c.series}</div>
                <div className="mt-0.5 font-semibold truncate group-hover:text-primary transition">{c.name}</div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Ref floor</div>
                    <div className="font-mono tabular-nums font-semibold">{fmtUSD(c.floorPrice)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">24h verified</div>
                    <div className="font-mono tabular-nums text-muted-foreground">{fmtUSD(c.volume24h)}</div>
                  </div>
                  <ChangeBadge value={c.change24h} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
