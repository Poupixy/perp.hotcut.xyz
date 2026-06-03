import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, TrendingUp, Layers, ShieldCheck, Activity } from "lucide-react";
import { categories, fmtUSD, sales } from "@/lib/mock-data";

const trackedPlatforms = [
  { name: "Magic Eden", market: "Live marketplace sales", status: "Live", statusTone: "live", refresh: "10 min refresh", coverage: "89 sales · 7d" },
  { name: "Phygitals", market: "Tracked via Magic Eden symbols", status: "Watching", statusTone: "watching", refresh: "10 min refresh", coverage: "0 sales · 30d" },
  { name: "Collector Crypt", market: "Needs official API or on-chain IDs", status: "To connect", statusTone: "pending", refresh: "Pending", coverage: "No public API" },
  { name: "Beezie", market: "Marketplace identified", status: "To connect", statusTone: "pending", refresh: "Pending", coverage: "Needs chain IDs" },
  { name: "Tensor", market: "Seen through Magic Eden aggregator", status: "Indirect", statusTone: "watching", refresh: "10 min refresh", coverage: "Via Magic Eden" },
  { name: "Helius / Solscan", market: "On-chain fallback", status: "Ready", statusTone: "pending", refresh: "Needs API keys", coverage: "Not active" },
];

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Perp RWA — Tokenized Collectibles Market Intelligence" },
      { name: "description", content: "Market intelligence for tokenized collectibles, verified sales, pricing trends, and liquidity across trading cards, sports memorabilia, and phygital assets." },
      { property: "og:title", content: "Perp RWA — Tokenized Collectibles Market Intelligence" },
      { property: "og:description", content: "Track verified sales, pricing trends, and liquidity across tokenized collectibles." },
    ],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/30">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Perp RWA</span>
            <span className="ml-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface text-muted-foreground border border-border">V1</span>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#categories" className="hover:text-foreground transition">Categories</a>
            <a href="#intelligence" className="hover:text-foreground transition">Intelligence</a>
            <a href="#sales" className="hover:text-foreground transition">Sales</a>
          </nav>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition"
          >
            Open Intelligence <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,oklch(0.78_0.14_75_/_0.12),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs text-muted-foreground mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Prototype data · category-first market structure
          </div>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight max-w-3xl leading-[1.05]">
            Market intelligence for{" "}
            <span className="text-gradient-gold">tokenized collectibles</span>.
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
            A market intelligence platform for tokenized collectibles, tracking
            verified sales, pricing trends, and liquidity across trading cards,
            sports memorabilia, and phygital assets.
          </p>
          <div className="mt-10 w-full max-w-6xl rounded-lg border border-border bg-card/70 overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Tracked platforms</div>
                <div className="text-sm font-semibold">Live data coverage by provider</div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                Magic Eden live
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-px bg-border">
              {trackedPlatforms.map((platform) => (
                <div key={platform.name} className="bg-card p-4 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold leading-tight">{platform.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground leading-snug">{platform.market}</div>
                    </div>
                    <div className={`shrink-0 inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] ${platform.statusTone === "live" ? "border-success/30 bg-success/10 text-success" : platform.statusTone === "watching" ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-surface text-muted-foreground"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${platform.statusTone === "live" ? "bg-success animate-pulse" : platform.statusTone === "watching" ? "bg-primary" : "bg-muted-foreground"}`} />
                      {platform.status}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 min-[420px]:grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md border border-border bg-surface px-3 py-2">
                      <div className="text-muted-foreground">Refresh</div>
                      <div className="mt-1 font-mono font-semibold">{platform.refresh}</div>
                    </div>
                    <div className="rounded-md border border-border bg-surface px-3 py-2">
                      <div className="text-muted-foreground">Coverage</div>
                      <div className="mt-1 font-mono font-semibold">{platform.coverage}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="categories" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Category-first market coverage</h2>
          <p className="mt-3 text-muted-foreground max-w-xl">Perp RWA organizes collectibles by broad market category first, then individual assets and confirmed sales.</p>

          <div className="mt-12 grid md:grid-cols-3 gap-px bg-border border border-border rounded-lg overflow-hidden">
            {categories.slice(0, 5).map((category) => (
              <div key={category.name} className="bg-card p-6">
                <Layers className="h-4 w-4 text-primary" />
                <h3 className="mt-3 text-sm font-semibold">{category.name}</h3>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Market scope</dt>
                    <dd className="mt-1 font-mono font-semibold">Global</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Assets</dt>
                    <dd className="mt-1 font-mono font-semibold">{category.assets.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">24h volume</dt>
                    <dd className="mt-1 font-mono font-semibold">{fmtUSD(category.volume24h)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">24h trend</dt>
                    <dd className="mt-1 font-mono font-semibold">{category.change24h > 0 ? "+" : ""}{category.change24h.toFixed(1)}%</dd>
                  </div>
                </dl>
              </div>
            ))}
            <div className="bg-card p-6">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h3 className="mt-3 text-sm font-semibold">Verified sales layer</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">Sales rows connect asset image, asset name, market category, grade, sale price, source, sale time, and price change.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="intelligence" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Built for market intelligence, not trading execution</h2>
          <p className="mt-3 text-muted-foreground max-w-xl">This prototype keeps the scope clear: research, pricing context, liquidity monitoring, and market-level discovery.</p>
          <div className="mt-12 grid md:grid-cols-3 gap-px bg-border border border-border rounded-lg overflow-hidden">
            {[
              { i: TrendingUp, t: "Pricing trends", d: "Monitor floor movement, volume, and sale-price changes across priority categories." },
              { i: Activity, t: "Verified sales context", d: "Compare asset-level transactions by market, grade, marketplace, and sale time." },
              { i: Sparkles, t: "Research workflow", d: "Use market and sales pages to focus on assets worth deeper analysis." },
            ].map((f) => (
              <div key={f.t} className="bg-card p-6">
                <f.i className="h-4 w-4 text-primary" />
                <h3 className="mt-3 text-sm font-semibold">{f.t}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="sales" className="border-b border-border bg-surface/40">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Recent verified sales</h2>
              <p className="mt-3 text-muted-foreground max-w-xl">Mock sales data shows the target hierarchy from market category to asset-level transaction.</p>
            </div>
            <Link
              to="/sales"
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md border border-border bg-surface text-sm font-medium hover:bg-surface-raised transition"
            >
              View sales <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="text-left font-medium px-5 py-3">Asset</th>
                  <th className="text-left font-medium px-5 py-3">Category</th>
                  <th className="text-left font-medium px-5 py-3">Market</th>
                  <th className="text-left font-medium px-5 py-3">Grade</th>
                  <th className="text-right font-medium px-5 py-3">Sale price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sales.slice(0, 4).map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-5 py-3 font-medium">{sale.asset}</td>
                    <td className="px-5 py-3 text-muted-foreground">{sale.category}</td>
                    <td className="px-5 py-3 text-muted-foreground">{sale.collectionName}</td>
                    <td className="px-5 py-3 text-muted-foreground">{sale.grade}</td>
                    <td className="px-5 py-3 text-right font-mono font-semibold">{fmtUSD(sale.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link
            to="/dashboard"
            className="mt-8 inline-flex items-center gap-2 h-11 px-6 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition"
          >
            Open Intelligence <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-7xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div>© 2026 Perp RWA. Prototype data for market-intelligence workflows.</div>
        <div>Tokenized collectibles · Trading cards · Phygital assets</div>
      </footer>
    </div>
  );
}
