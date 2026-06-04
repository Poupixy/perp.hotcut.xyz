import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { fmtUSD, isApprovedMarketSlug, realProviderCollections } from "@/lib/real-market-data";
import { RelativeTime } from "@/components/app/RelativeTime";
import { useMarketSales } from "@/lib/market-data/use-market-sales";
import type { NormalizedSale } from "@/lib/market-data/types";
import { trackedMarketLabel } from "@/services/trackedMarketCategories";

export const Route = createFileRoute("/_app/sales")({
  component: SalesPage,
  head: () => ({ meta: [{ title: "Verified Sales — Perp RWA" }] }),
});

function SalesPage() {
  const [nftMarketFilter, setNftMarketFilter] = useState("all");
  const [nftCollectionFilter, setNftCollectionFilter] = useState("all");
  const { data, loading, error } = useMarketSales(7);
  const trackedNfts = useTrackedNftAssets();
  const rows = (data?.sales ?? []).filter((sale) => isApprovedMarketSlug(sale.marketSlug));
  const usdRows = rows.filter((sale) => sale.currency === "USD");
  const total = usdRows.reduce((sum, sale) => sum + sale.salePrice, 0);
  const average = usdRows.length ? total / usdRows.length : 0;
  const nftRows = useMemo(() => {
    return trackedNfts.items.filter((nft) => {
      if (!isApprovedTrackedNft(nft)) return false;
      if (nftMarketFilter !== "all" && nft.market !== nftMarketFilter) return false;
      if (nftCollectionFilter !== "all" && nft.asset?.collection !== nftCollectionFilter) return false;
      return true;
    });
  }, [trackedNfts.items, nftMarketFilter, nftCollectionFilter]);
  const nftMarkets = useMemo(() => Array.from(new Set(trackedNfts.items.filter(isApprovedTrackedNft).map((nft) => nft.market))).sort(), [trackedNfts.items]);
  const nftCollections = useMemo(() => Array.from(new Set(trackedNfts.items.filter(isApprovedTrackedNft).map((nft) => nft.asset?.collection).filter((value): value is string => Boolean(value)))).sort(), [trackedNfts.items]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Verified Sales</h1>
        <p className="text-sm text-muted-foreground mt-1">Approved 7-day sales only: Pokémon, One Piece, NBA, NFL, NHL, Baseball, Soccer, Yu-Gi-Oh, Dragon Ball, and Magic The Gathering.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Approved 7d sales" value={loading ? "..." : rows.length.toString()} />
        <Stat label="USD volume" value={loading ? "..." : fmtUSD(total)} />
        <Stat label="Average USD sale" value={loading ? "..." : fmtUSD(average)} />
      </div>

      <DataStatus data={data} error={error} loading={loading} />

      <TrackedNftSalesPanel
        nfts={nftRows}
        loading={trackedNfts.loading}
        error={trackedNfts.error}
        status={trackedNfts.status}
        markets={nftMarkets}
        collections={nftCollections}
        marketFilter={nftMarketFilter}
        collectionFilter={nftCollectionFilter}
        onMarketChange={setNftMarketFilter}
        onCollectionChange={setNftCollectionFilter}
        onReload={trackedNfts.load}
      />

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="text-left font-medium px-5 py-3">Asset</th>
              <th className="text-left font-medium px-5 py-3">Market</th>
              <th className="text-left font-medium px-5 py-3">Grade</th>
              <th className="text-right font-medium px-5 py-3">Sale price</th>
              <th className="text-right font-medium px-5 py-3">Provider</th>
              <th className="text-left font-medium px-5 py-3">Marketplace</th>
              <th className="text-right font-medium px-5 py-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 && !loading ? (
              <tr><td colSpan={7} className="px-5 py-8 text-sm text-muted-foreground">No approved confirmed sales in the current 7-day window. Non-approved provider rows are hidden.</td></tr>
            ) : rows.map((s) => (
              <tr key={s.id} className="hover:bg-surface-raised/40 transition">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    {s.assetImage ? <img src={s.assetImage} alt="" className="h-9 w-9 rounded object-cover bg-muted" /> : <div className="h-9 w-9 rounded bg-muted" />}
                    <span className="font-medium">{s.assetName}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{s.marketName}</td>
                <td className="px-5 py-3 text-muted-foreground">{s.grade ?? "Verified"}</td>
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

const APPROVED_NFT_MARKETS = new Set<string>(NFT_MARKET_OPTIONS.map(([value]) => value));
const ALLOWED_NFT_COLLECTIONS = new Set(realProviderCollections.map((collection) => collection.address));

type NftIngestionStatus = {
  heliusConfigured: boolean;
  trackedCount: number;
  activeTrackedCount: number;
  fetchedAssetCount: number;
  queue: { queue: string[]; processing: boolean; lastHeliusCallAt: string | null; backoffUntil: string | null };
};

type TrackedNftAsset = {
  mint: string;
  market: string;
  label: string | null;
  active: boolean;
  last_fetched_at: string | null;
  asset: {
    mint: string;
    market: string;
    name: string | null;
    image: string | null;
    owner: string | null;
    collection: string | null;
    token_standard: string | null;
    interface: string | null;
    updated_at: string;
  } | null;
};

function isApprovedTrackedNft(nft: TrackedNftAsset) {
  if (!nft.active || !APPROVED_NFT_MARKETS.has(nft.market)) return false;
  if (!nft.asset) return false;
  return Boolean(nft.asset.collection && ALLOWED_NFT_COLLECTIONS.has(nft.asset.collection));
}

function useTrackedNftAssets() {
  const [items, setItems] = useState<TrackedNftAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [status, setStatus] = useState<NftIngestionStatus | undefined>();

  async function load(signal?: AbortSignal) {
      setLoading(true);
      setError(undefined);
      try {
        const [trackedResponse, statusResponse] = await Promise.all([
          fetch("/api/nfts/tracked?active=true&fetched=true&approved=true", { signal, headers: { accept: "application/json" } }),
          fetch("/api/nfts/status", { signal, headers: { accept: "application/json" } }),
        ]);
        const payload = await trackedResponse.json() as { nfts?: TrackedNftAsset[]; error?: string };
        const statusPayload = await statusResponse.json() as NftIngestionStatus;
        if (!trackedResponse.ok) throw new Error(payload.error ?? "Unable to load tracked NFT assets");
        setItems(payload.nfts ?? []);
        setStatus(statusPayload);
      } catch (error) {
        if (signal?.aborted) return;
        setError(error instanceof Error ? error.message : "Unable to load tracked NFT assets");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
  }

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, []);

  return { items, loading, error, status, load: () => load() };
}

function TrackedNftSalesPanel({
  nfts,
  loading,
  error,
  status,
  markets,
  collections,
  marketFilter,
  collectionFilter,
  onMarketChange,
  onCollectionChange,
  onReload,
}: {
  nfts: TrackedNftAsset[];
  loading: boolean;
  error?: string;
  status?: NftIngestionStatus;
  markets: string[];
  collections: string[];
  marketFilter: string;
  collectionFilter: string;
  onMarketChange: (value: string) => void;
  onCollectionChange: (value: string) => void;
  onReload: () => Promise<void>;
}) {
  const [mint, setMint] = useState("");
  const [market, setMarket] = useState("pokemon");
  const [label, setLabel] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function postJson(url: string, body: unknown) {
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json().catch(() => ({})) as { error?: string; message?: string; status?: string; retryAfterMs?: number };
    if (!response.ok) throw new Error(payload.error ?? payload.message ?? "Request failed");
    return payload;
  }

  async function track() {
    try {
      setMessage(null);
      await postJson("/api/nfts/track", { mint, market, label });
      setMint("");
      setLabel("");
      setMessage("NFT ajouté dans tracked_nfts. Lance Refresh quand HELIUS_API_KEY est configurée.");
      await onReload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to track NFT");
    }
  }

  async function refresh(targetMint: string) {
    try {
      const payload = await postJson("/api/nfts/refresh", { mint: targetMint, force: false });
      setMessage(payload.retryAfterMs ? `${payload.message}. Retry after ${Math.ceil(payload.retryAfterMs / 1000)}s.` : payload.message ?? "Refresh requested.");
      await onReload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to refresh NFT");
    }
  }

  async function untrack(targetMint: string) {
    try {
      await postJson("/api/nfts/untrack", { mint: targetMint });
      setMessage("NFT désactivé dans tracked_nfts.");
      await onReload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to untrack NFT");
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 p-5 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold">Approved tracked NFT assets</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Only fetched NFTs from approved markets and allowlisted provider collections are shown here.</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            <span className={`rounded border px-2 py-1 ${status?.heliusConfigured ? "border-success/30 bg-success/10 text-success" : "border-danger/30 bg-danger/10 text-danger"}`}>Helius {status?.heliusConfigured ? "configured" : "missing key"}</span>
            <span className="rounded border border-border bg-surface px-2 py-1">Tracked {status?.activeTrackedCount ?? 0}</span>
            <span className="rounded border border-border bg-surface px-2 py-1">Fetched {status?.fetchedAssetCount ?? 0}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={marketFilter} onChange={(event) => onMarketChange(event.target.value)} className="h-9 rounded-md border border-border bg-surface px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="all">All markets</option>
            {markets.map((market) => <option key={market} value={market}>{trackedMarketLabel(market)}</option>)}
          </select>
          <select value={collectionFilter} onChange={(event) => onCollectionChange(event.target.value)} className="h-9 rounded-md border border-border bg-surface px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="all">All NFT collections</option>
            {collections.map((collection) => <option key={collection} value={collection}>{shorten(collection, 18)}</option>)}
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.5fr] gap-px bg-border border-b border-border">
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
        <div className="bg-card p-5 text-xs text-muted-foreground leading-relaxed">
          <div className="font-medium text-foreground">Filtrage strict</div>
          <p className="mt-1">Seuls les mints des marchés approuvés et des collections allowlistées Collector Crypt / Phygitals sont affichés ici. Les autres données provider sont masquées.</p>
          {!status?.heliusConfigured && <p className="mt-2 text-danger">HELIUS_API_KEY n’est pas configurée dans le conteneur, donc les NFTs suivis resteront en attente jusqu’à configuration.</p>}
        </div>
      </div>

      {loading ? (
        <div className="p-5 text-sm text-muted-foreground">Loading stored tracked NFTs...</div>
      ) : error ? (
        <div className="p-5 text-sm text-destructive">{error}</div>
      ) : nfts.length === 0 ? (
        <div className="p-5 text-sm text-muted-foreground">No approved fetched NFTs match the selected filters.</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="text-left font-medium px-5 py-3">NFT asset</th>
              <th className="text-left font-medium px-5 py-3">Market</th>
              <th className="text-left font-medium px-5 py-3">NFT collection</th>
              <th className="text-left font-medium px-5 py-3">Owner</th>
              <th className="text-left font-medium px-5 py-3">Standard</th>
              <th className="text-right font-medium px-5 py-3">Last fetched</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {nfts.map((nft) => (
              <tr key={nft.mint} className="hover:bg-surface-raised/40 transition">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {nft.asset?.image ? <img src={nft.asset.image} alt="" className="h-9 w-9 rounded object-cover bg-muted" /> : <div className="h-9 w-9 rounded bg-muted" />}
                    <div className="min-w-0">
                      <div className="font-medium truncate">{nft.asset?.name ?? nft.label ?? "Stored NFT"}</div>
                      <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[240px]">{nft.mint}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{trackedMarketLabel(nft.market)}</td>
                <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{nft.asset?.collection ? shorten(nft.asset.collection, 18) : "--"}</td>
                <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{nft.asset?.owner ? shorten(nft.asset.owner, 12) : "--"}</td>
                <td className="px-5 py-3 text-muted-foreground">{nft.asset?.token_standard ?? nft.asset?.interface ?? "Pending"}</td>
                <td className="px-5 py-3 text-right text-muted-foreground text-xs">
                  <div>{nft.last_fetched_at ? <RelativeTime iso={nft.last_fetched_at} /> : "Pending"}</div>
                  <div className="mt-2 flex justify-end gap-2">
                    <button onClick={() => refresh(nft.mint)} className="rounded border border-border bg-surface px-2 py-1 text-[10px] hover:bg-surface-raised">Refresh</button>
                    <button onClick={() => untrack(nft.mint)} className="rounded border border-border bg-surface px-2 py-1 text-[10px] hover:bg-surface-raised">Untrack</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function shorten(value: string, size: number) {
  if (value.length <= size) return value;
  const edge = Math.max(4, Math.floor((size - 1) / 2));
  return `${value.slice(0, edge)}…${value.slice(-edge)}`;
}
