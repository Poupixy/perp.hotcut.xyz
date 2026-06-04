import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { categories, collections, fmtUSD } from "@/lib/mock-data";
import { ChangeBadge } from "@/components/app/Badges";
import { ArrowUpRight, TrendingUp, DollarSign, Layers, BarChart3 } from "lucide-react";
import { usePokemonIndex } from "@/lib/rwa-index/use-pokemon-index";
import type { IndexSnapshot, Sale as IndexSale } from "@/lib/rwa-index/models";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Market Overview — Perp RWA" }] }),
});

function Dashboard() {
  const pokemonIndex = usePokemonIndex();
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

      <PokemonIndexPanel index={pokemonIndex.index} loading={pokemonIndex.loading} error={pokemonIndex.error} />

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

      <TrackedNftsPanel />

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
            {pokemonIndex.loading ? (
              <div className="p-5 text-sm text-muted-foreground">Loading confirmed sales...</div>
            ) : pokemonIndex.latestSales.length ? (
              pokemonIndex.latestSales.map((sale) => <ConfirmedSaleRow key={sale.id} sale={sale} />)
            ) : (
              <div className="p-5 text-sm text-muted-foreground">No confirmed sales available.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


function PokemonIndexPanel({ index, loading, error }: { index?: IndexSnapshot; loading: boolean; error?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 p-5 border-b border-border">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">POKEMON-PERP index feed</div>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">POKEMON_INDEX</h2>
          <p className="text-xs text-muted-foreground mt-1">Confirmed executed sales only. Listings and floor prices are excluded from the core index.</p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs">
          <span className={`h-2 w-2 rounded-full ${index?.stale ? "bg-danger" : "bg-success"}`} />
          {loading ? "Loading" : error ? "Unavailable" : index?.stale ? "Stale" : "Live"}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-px bg-border">
        <IndexMetric label="Index price" value={loading ? "..." : index ? fmtUSD(index.indexPrice) : "--"} />
        <IndexMetric label="10m Pulse" value={formatNullableUsd(index?.vwap10m)} change={index?.growth10m} />
        <IndexMetric label="30m Trend" value={formatNullableUsd(index?.vwap30m)} change={index?.growth30m} />
        <IndexMetric label="Volume 10m" value={loading ? "..." : fmtUSD(index?.volume10m ?? 0)} />
        <IndexMetric label="Volume 30m" value={loading ? "..." : fmtUSD(index?.volume30m ?? 0)} />
        <IndexMetric label="Sales 10m" value={loading ? "..." : String(index?.salesCount10m ?? 0)} />
        <IndexMetric label="Sales 30m" value={loading ? "..." : String(index?.salesCount30m ?? 0)} />
        <IndexMetric label="Confidence" value={loading ? "..." : `${index?.confidenceScore ?? 0}/100`} />
      </div>
      {index?.staleReason && <div className="px-5 py-3 text-xs text-muted-foreground border-t border-border">{index.staleReason}</div>}
    </div>
  );
}

function IndexMetric({ label, value, change }: { label: string; value: string; change?: number | null }) {
  return (
    <div className="bg-card p-4 min-w-0">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground truncate">{label}</div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold font-mono tabular-nums truncate">{value}</span>
        {typeof change === "number" && <ChangeBadge value={change} />}
      </div>
    </div>
  );
}

function ConfirmedSaleRow({ sale }: { sale: IndexSale }) {
  return (
    <Link to="/collections/$slug" params={{ slug: sale.market }} className="flex items-center gap-3 p-3.5 hover:bg-surface-raised/50 transition">
      {sale.assetImage ? <img src={sale.assetImage} alt="" className="h-10 w-10 rounded-md object-cover bg-muted" /> : <div className="h-10 w-10 rounded-md bg-muted" />}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{sale.assetName}</div>
        <div className="text-xs text-muted-foreground">{sale.platform} · {sale.grade ?? "Confirmed sale"}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold font-mono tabular-nums">{fmtUSD(sale.priceUsd)}</div>
        <div className="text-[10px] text-muted-foreground">{new Date(sale.timestamp).toLocaleTimeString()}</div>
      </div>
    </Link>
  );
}

function formatNullableUsd(value?: number | null) {
  return typeof value === "number" ? fmtUSD(value) : "--";
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


type TrackedNftAsset = {
  mint: string;
  market: string;
  name: string | null;
  image: string | null;
  owner: string | null;
  collection: string | null;
  updated_at: string;
};

type TrackedNftView = {
  mint: string;
  market: string;
  label: string | null;
  active: boolean;
  last_fetched_at: string | null;
  asset: TrackedNftAsset | null;
};

type CollectionPreviewAsset = {
  mint: string;
  name: string | null;
  image: string | null;
  owner: string | null;
  collection: string | null;
  tokenStandard: string | null;
  interface: string | null;
};

const NFT_MARKET_OPTIONS = [
  ["pokemon", "Pokémon"],
  ["one_piece", "One Piece"],
  ["nba", "NBA"],
  ["nfl", "NFL"],
  ["nhl", "NHL"],
  ["baseball", "Baseball"],
  ["soccer", "Soccer"],
  ["yugioh", "Yu-Gi-Oh"],
  ["dragon_ball", "Dragon Ball"],
  ["magic_the_gathering", "Magic The Gathering"],
] as const;

function TrackedNftsPanel() {
  const [items, setItems] = useState<TrackedNftView[]>([]);
  const [mint, setMint] = useState("");
  const [market, setMarket] = useState("pokemon");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/nfts/tracked", { headers: { accept: "application/json" } });
      const payload = await response.json() as { nfts?: TrackedNftView[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to load tracked NFTs");
      setItems(payload.nfts ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load tracked NFTs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function postJson(url: string, body: unknown) {
    setMessage(null);
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json().catch(() => ({})) as { error?: string; message?: string };
    if (!response.ok) throw new Error(payload.error ?? payload.message ?? "Request failed");
    return payload;
  }

  async function track() {
    try {
      await postJson("/api/nfts/track", { mint, market, label });
      setMint("");
      setLabel("");
      setMessage("NFT added to tracked_nfts.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to track NFT");
    }
  }

  async function untrack(targetMint: string) {
    try {
      await postJson("/api/nfts/untrack", { mint: targetMint });
      setMessage("NFT marked inactive.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to untrack NFT");
    }
  }

  async function refresh(targetMint: string) {
    try {
      const payload = await postJson("/api/nfts/refresh", { mint: targetMint, force: false }) as { status?: string; message?: string; retryAfterMs?: number };
      setMessage(payload.retryAfterMs ? `${payload.message} Retry after ${Math.ceil(payload.retryAfterMs / 1000)}s.` : payload.message ?? "Refresh requested.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to refresh NFT");
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 p-5 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold">Controlled NFT tracking</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Only allowlisted mints in tracked_nfts can be fetched through the server-side Helius queue.</p>
        </div>
        <div className="text-[11px] text-muted-foreground font-mono">2 Helius calls/min max</div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-px bg-border">
        <div className="bg-card p-5 space-y-3">
          <input value={mint} onChange={(event) => setMint(event.target.value)} placeholder="NFT mint address" className="w-full h-10 rounded-md border border-border bg-surface px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          <div className="grid sm:grid-cols-2 gap-3">
            <select value={market} onChange={(event) => setMarket(event.target.value)} className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
              {NFT_MARKET_OPTIONS.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
            </select>
            <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Optional label" className="h-10 rounded-md border border-border bg-surface px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <button onClick={track} className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition">Track NFT</button>
          {message && <div className="text-xs text-muted-foreground">{message}</div>}
        </div>

        <div className="bg-card divide-y divide-border max-h-[520px] overflow-auto">
          {loading ? (
            <div className="p-5 text-sm text-muted-foreground">Loading tracked NFTs...</div>
          ) : items.length === 0 ? (
            <div className="p-5 text-sm text-muted-foreground">No tracked NFTs yet.</div>
          ) : items.map((item) => (
            <div key={item.mint} className="p-4 flex gap-3">
              {item.asset?.image ? <img src={item.asset.image} alt="" className="h-14 w-14 rounded-md object-cover bg-muted" /> : <div className="h-14 w-14 rounded-md bg-muted" />}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-medium text-sm truncate">{item.asset?.name ?? item.label ?? "Unfetched NFT"}</div>
                  {!item.active && <span className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">Inactive</span>}
                </div>
                <div className="mt-1 text-xs text-muted-foreground font-mono truncate">{item.mint}</div>
                <div className="mt-1 grid sm:grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>Market: {item.market}</span>
                  <span>Last fetch: {item.last_fetched_at ? new Date(item.last_fetched_at).toLocaleString() : "Never"}</span>
                  <span className="truncate">Owner: {item.asset?.owner ?? "--"}</span>
                  <span className="truncate">Collection: {item.asset?.collection ?? "--"}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => refresh(item.mint)} disabled={!item.active} className="h-8 px-3 rounded-md border border-border bg-surface text-xs hover:bg-surface-raised disabled:opacity-50">Refresh</button>
                  {item.active && <button onClick={() => untrack(item.mint)} className="h-8 px-3 rounded-md border border-border bg-surface text-xs text-muted-foreground hover:text-foreground hover:bg-surface-raised">Untrack</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CollectionDiscoveryPanel onIngested={load} />
    </div>
  );
}

function CollectionDiscoveryPanel({ onIngested }: { onIngested: () => Promise<void> }) {
  const [collectionAddress, setCollectionAddress] = useState("");
  const [assets, setAssets] = useState<CollectionPreviewAsset[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function postCollection(url: string, body: unknown) {
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json().catch(() => ({})) as { error?: string; assets?: CollectionPreviewAsset[]; total?: number | null; savedAssets?: number; assetsFound?: number; skippedAssets?: number };
    if (!response.ok) throw new Error(payload.error ?? "Request failed");
    return payload;
  }

  async function previewCollection() {
    setLoadingPreview(true);
    setMessage(null);
    try {
      const payload = await postCollection("/api/nfts/collections/preview", { collectionAddress, limit: 10 });
      setAssets(payload.assets ?? []);
      setTotal(payload.total ?? null);
      setMessage(`Preview loaded: ${(payload.assets ?? []).length} NFTs shown${typeof payload.total === "number" ? ` / ${payload.total} total` : ""}.`);
    } catch (error) {
      setAssets([]);
      setTotal(null);
      setMessage(error instanceof Error ? error.message : "Unable to preview collection");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function ingestCollection() {
    setIngesting(true);
    setMessage(null);
    try {
      const payload = await postCollection("/api/nfts/collections/ingest", { collectionAddress });
      setMessage(`Collection saved: ${payload.savedAssets ?? 0} NFTs stored from ${payload.assetsFound ?? 0} assets found. ${payload.skippedAssets ?? 0} ignored outside tracked categories.`);
      await onIngested();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to ingest collection");
    } finally {
      setIngesting(false);
    }
  }

  const disabled = !collectionAddress.trim() || loadingPreview || ingesting;

  return (
    <div className="border-t border-border bg-card p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Collection discovery</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Paste an allowlisted Helius collection address to preview its NFTs before saving them into tracked_nfts.</p>
        </div>
        <div className="text-[11px] text-muted-foreground font-mono">Preview: 10 NFTs · server-side Helius</div>
      </div>

      <div className="grid lg:grid-cols-[1fr_auto_auto] gap-3">
        <input
          value={collectionAddress}
          onChange={(event) => setCollectionAddress(event.target.value)}
          placeholder="Collection address, e.g. CCrypt..."
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button onClick={previewCollection} disabled={disabled} className="h-10 px-4 rounded-md border border-border bg-surface text-sm font-medium hover:bg-surface-raised disabled:opacity-50 transition">
          {loadingPreview ? "Loading..." : "Preview NFTs"}
        </button>
        <button onClick={ingestCollection} disabled={disabled} className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition">
          {ingesting ? "Saving..." : "Save collection"}
        </button>
      </div>

      {message && <div className="text-xs text-muted-foreground">{message}</div>}

      {assets.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground font-mono">{assets.length} NFTs shown{typeof total === "number" ? ` · ${total} total reported by Helius` : ""}</div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {assets.map((asset) => (
              <div key={asset.mint} className="rounded-md border border-border bg-surface p-3 min-w-0">
                {asset.image ? <img src={asset.image} alt="" className="aspect-square w-full rounded object-cover bg-muted" /> : <div className="aspect-square w-full rounded bg-muted" />}
                <div className="mt-3 text-sm font-medium truncate">{asset.name ?? "Unnamed NFT"}</div>
                <div className="mt-1 text-[11px] text-muted-foreground font-mono truncate">{asset.mint}</div>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <div className="truncate">Owner: {asset.owner ?? "--"}</div>
                  <div className="truncate">Collection: {asset.collection ?? "--"}</div>
                  <div className="truncate">Standard: {asset.tokenStandard ?? asset.interface ?? "--"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
