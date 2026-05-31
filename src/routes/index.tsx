import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, TrendingUp, Layers, ShieldCheck, Activity } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Perp RWA — Collectibles Markets Dashboard" },
      { name: "description", content: "Track NFT and phygital collectibles markets. Floor prices, volume and recent sales for Pokémon, One Piece, NBA, NHL and NFL." },
      { property: "og:title", content: "Perp RWA — Collectibles Markets Dashboard" },
      { property: "og:description", content: "Real-time floor prices and volume for tokenized collectibles." },
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
            <a href="#markets" className="hover:text-foreground transition">Markets</a>
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#coverage" className="hover:text-foreground transition">Coverage</a>
          </nav>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition"
          >
            Open Dashboard <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,oklch(0.78_0.14_75_/_0.12),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs text-muted-foreground mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Live across 8 collections · mock data preview
          </div>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight max-w-3xl leading-[1.05]">
            The market layer for{" "}
            <span className="text-gradient-gold">tokenized collectibles</span>.
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
            Track floor prices, volume and sales across NFTs and phygital
            collections — Pokémon, One Piece, NBA, NHL, NFL and more —
            in one professional dashboard.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition"
            >
              Open Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/collections"
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md border border-border bg-surface text-sm font-medium hover:bg-surface-raised transition"
            >
              Browse collections
            </Link>
          </div>

          <dl className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border border-border rounded-lg overflow-hidden">
            {[
              { l: "Tracked collections", v: "8" },
              { l: "24h volume", v: "$591K" },
              { l: "Marketplaces", v: "4" },
              { l: "Asset types", v: "NFT · Phygital" },
            ].map((s) => (
              <div key={s.l} className="bg-card p-5">
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.l}</dt>
                <dd className="mt-1.5 text-lg font-semibold font-mono tabular-nums">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="features" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Built for serious market watchers</h2>
          <p className="mt-3 text-muted-foreground max-w-xl">Institutional-grade visibility across emerging collectibles markets — no noise, no gimmicks.</p>

          <div className="mt-12 grid md:grid-cols-3 gap-px bg-border border border-border rounded-lg overflow-hidden">
            {[
              { i: TrendingUp, t: "Floor & volume tracking", d: "24h and 7d floor, volume and change for every tracked collection." },
              { i: Layers, t: "Unified asset types", d: "NFT, RWA and phygital collectibles in one consistent schema." },
              { i: Activity, t: "Live sales feed", d: "Recent sales across Courtyard, Collector Crypt, OpenSea and more." },
              { i: ShieldCheck, t: "RWA verification", d: "Clear flags for physically-backed and tokenized real-world assets." },
              { i: Sparkles, t: "Watchlist", d: "Pin the collections you care about and surface them at the top." },
              { i: ArrowRight, t: "API-ready (soon)", d: "Same schema you see in the UI will be exposed via a public API." },
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

      <section id="coverage" className="border-b border-border bg-surface/40">
        <div className="mx-auto max-w-7xl px-6 py-24 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Ready to explore the markets?</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Open the dashboard to see live floor prices, volume trends and recent sales.</p>
          <Link
            to="/dashboard"
            className="mt-8 inline-flex items-center gap-2 h-11 px-6 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition"
          >
            Open Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-7xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div>© 2026 Perp RWA. Mock data for demo purposes.</div>
        <div>Built for collectible markets · NFT · Phygital</div>
      </footer>
    </div>
  );
}
