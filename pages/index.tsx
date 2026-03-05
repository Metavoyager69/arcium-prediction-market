import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useWallet } from "@solana/wallet-adapter-react";
import Navbar from "../components/Navbar";
import MarketCard from "../components/MarketCard";
import {
  CATEGORY_STYLES,
  DEMO_MARKETS,
  DEMO_POSITIONS,
  MARKET_CATEGORIES,
  calculatePositionPnl,
  getPortfolioSummary,
  type DemoMarket,
  type DemoPosition,
  type MarketCategory,
} from "../utils/program";
import {
  deserializeMarket,
  deserializePosition,
  type ApiMarket,
  type ApiPosition,
} from "../utils/api";

const TICKER_ITEMS = [
  "STAKES ENCRYPTED | ARCIUM MPC",
  "VOTES HIDDEN UNTIL SETTLEMENT",
  "NO HERDING | NO MANIPULATION",
  "FAIR | PRIVATE | ON-CHAIN",
  "SOLANA x ARCIUM",
];

function formatSigned(value: number): string {
  const rounded = Math.abs(value).toFixed(2);
  return `${value >= 0 ? "+" : "-"}${rounded} SOL`;
}

type StatusFilter = "all" | "open" | "settled";
type CategoryFilter = "all" | MarketCategory;

export default function Home() {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? "demo_wallet";

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [markets, setMarkets] = useState<DemoMarket[]>(DEMO_MARKETS);
  const [positions, setPositions] = useState<DemoPosition[]>(DEMO_POSITIONS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFromApi() {
      setLoading(true);
      setLoadError(null);

      try {
        const [marketsResponse, portfolioResponse] = await Promise.all([
          fetch("/api/markets"),
          fetch(`/api/portfolio?wallet=${encodeURIComponent(wallet)}`),
        ]);

        const marketsPayload = await marketsResponse.json();
        const portfolioPayload = await portfolioResponse.json();

        if (!marketsResponse.ok) {
          throw new Error(marketsPayload?.error ?? "Could not load markets.");
        }
        if (!portfolioResponse.ok) {
          throw new Error(portfolioPayload?.error ?? "Could not load portfolio.");
        }

        if (!cancelled) {
          const marketItems = Array.isArray(marketsPayload?.markets)
            ? (marketsPayload.markets as ApiMarket[]).map((item) => deserializeMarket(item))
            : DEMO_MARKETS;
          const positionItems = Array.isArray(portfolioPayload?.positions)
            ? (portfolioPayload.positions as ApiPosition[]).map((item) => deserializePosition(item))
            : DEMO_POSITIONS;

          setMarkets(marketItems);
          setPositions(positionItems);
        }
      } catch (caught) {
        if (!cancelled) {
          const message = caught instanceof Error ? caught.message : "Unknown API error.";
          setLoadError(message);
          setMarkets(DEMO_MARKETS);
          setPositions(DEMO_POSITIONS);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadFromApi();
    return () => {
      cancelled = true;
    };
  }, [wallet]);

  const filtered = useMemo(
    () =>
      markets.filter((market) => {
        if (statusFilter === "open" && market.status !== "Open") return false;
        if (statusFilter === "settled" && market.status !== "Settled") return false;
        if (categoryFilter !== "all" && market.category !== categoryFilter) return false;
        return true;
      }),
    [markets, statusFilter, categoryFilter]
  );

  const groupedByCategory = useMemo(() => {
    if (categoryFilter !== "all") {
      return [{ category: categoryFilter, markets: filtered }];
    }
    return MARKET_CATEGORIES.map((category) => ({
      category,
      markets: filtered.filter((market) => market.category === category),
    })).filter((group) => group.markets.length > 0);
  }, [filtered, categoryFilter]);

  const summary = useMemo(() => getPortfolioSummary(positions), [positions]);
  const recentPositions = useMemo(
    () =>
      [...positions]
        .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
        .slice(0, 4),
    [positions]
  );

  return (
    <>
      <Head>
        <title>Oracle Nexus | Private Prediction Markets on Solana</title>
        <meta
          name="description"
          content="Encrypted prediction markets where stakes and votes stay private until Arcium MPC settlement."
        />
      </Head>

      <Navbar />

      <main style={{ minHeight: "100vh", paddingTop: "72px" }}>
        <div
          className="overflow-hidden py-2"
          style={{
            background: "rgba(107,63,160,0.15)",
            borderBottom: "1px solid rgba(107,63,160,0.2)",
          }}
        >
          <div className="marquee-track">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="mx-8 font-mono text-xs tracking-widest"
                style={{ color: "#C084FC", whiteSpace: "nowrap" }}
              >
                * {item}
              </span>
            ))}
          </div>
        </div>

        <section className="relative overflow-hidden px-6 py-20 text-center">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(107,63,160,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(107,63,160,0.12) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative mx-auto max-w-3xl">
            <div className="encrypted-tag mb-6 mx-auto w-fit">
              PRIVATE MARKETS POWERED BY ARCIUM MPC
            </div>
            <h1
              className="font-display mb-4 tracking-wider leading-none"
              style={{ fontSize: "clamp(3rem, 8vw, 6rem)", color: "white" }}
            >
              PREDICT
              <br />
              <span className="gradient-text">WITHOUT EXPOSURE</span>
            </h1>
            <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-slate-400">
              Oracle Nexus keeps stake size, vote direction, and resolution inputs encrypted until
              settlement. Public outcomes, private positions.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="#markets" className="btn-primary">
                Browse Markets
              </a>
              <Link href="/portfolio" className="btn-secondary">
                Open Portfolio
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-3xl tracking-widest text-white">PORTFOLIO PNL</h2>
            <Link href="/portfolio" className="font-mono text-xs text-cyan-400">
              VIEW FULL HISTORY
            </Link>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card p-5">
              <p className="font-mono text-xs text-slate-500">REALIZED</p>
              <p
                className="mt-2 font-mono text-xl"
                style={{ color: summary.realizedPnl >= 0 ? "#34D399" : "#F87171" }}
              >
                {formatSigned(summary.realizedPnl)}
              </p>
            </div>
            <div className="card p-5">
              <p className="font-mono text-xs text-slate-500">UNREALIZED</p>
              <p
                className="mt-2 font-mono text-xl"
                style={{ color: summary.unrealizedPnl >= 0 ? "#34D399" : "#F87171" }}
              >
                {formatSigned(summary.unrealizedPnl)}
              </p>
            </div>
            <div className="card p-5">
              <p className="font-mono text-xs text-slate-500">WIN RATE</p>
              <p className="mt-2 font-mono text-xl text-white">{summary.winRate.toFixed(1)}%</p>
            </div>
            <div className="card p-5">
              <p className="font-mono text-xs text-slate-500">OPEN POSITIONS</p>
              <p className="mt-2 font-mono text-xl text-white">{summary.openCount}</p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <div
                className="grid px-4 py-3 font-mono text-xs tracking-wider text-slate-500"
                style={{
                  gridTemplateColumns: "1.5fr 0.7fr 0.6fr 0.8fr 0.8fr",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  minWidth: "700px",
                }}
              >
                <span>MARKET</span>
                <span>SIDE</span>
                <span>STAKE</span>
                <span>STATUS</span>
                <span>PNL</span>
              </div>
              {recentPositions.map((position) => {
                const pnl = calculatePositionPnl(position);
                return (
                  <Link
                    key={position.id}
                    href={`/market/${position.marketId}`}
                    className="grid px-4 py-3 text-sm no-underline transition-colors hover:bg-white/5"
                    style={{
                      gridTemplateColumns: "1.5fr 0.7fr 0.6fr 0.8fr 0.8fr",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      minWidth: "700px",
                    }}
                  >
                    <span className="text-slate-200">{position.marketTitle}</span>
                    <span
                      className="font-mono"
                      style={{ color: position.side === "YES" ? "#34D399" : "#F87171" }}
                    >
                      {position.side}
                    </span>
                    <span className="font-mono text-slate-300">{position.stakeSol.toFixed(2)} SOL</span>
                    <span className="font-mono text-slate-300">{position.status.toUpperCase()}</span>
                    <span className="font-mono" style={{ color: pnl >= 0 ? "#34D399" : "#F87171" }}>
                      {formatSigned(pnl)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section id="markets" className="mx-auto max-w-5xl px-6 pb-20">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-3xl tracking-widest text-white">MARKET CATEGORIES</h2>
            {loading ? (
              <p className="font-mono text-xs text-slate-500">Loading API data...</p>
            ) : loadError ? (
              <p className="font-mono text-xs text-amber-300">Using fallback demo data: {loadError}</p>
            ) : (
              <p className="font-mono text-xs text-emerald-300">Live backend data loaded</p>
            )}
          </div>

          <div className="mb-4">
            <p className="mb-2 font-mono text-xs tracking-widest text-slate-500">CATEGORY</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoryFilter("all")}
                className="rounded-lg px-4 py-2 font-mono text-xs tracking-wider transition-all"
                style={{
                  background: categoryFilter === "all" ? "rgba(107,63,160,0.3)" : "transparent",
                  border: `1px solid ${
                    categoryFilter === "all" ? "rgba(192,132,252,0.5)" : "rgba(255,255,255,0.1)"
                  }`,
                  color: categoryFilter === "all" ? "#C084FC" : "#64748b",
                }}
              >
                ALL CATEGORIES
              </button>
              {MARKET_CATEGORIES.map((category) => {
                const style = CATEGORY_STYLES[category];
                const selected = categoryFilter === category;
                return (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                    className="rounded-lg px-4 py-2 font-mono text-xs tracking-wider transition-all"
                    style={{
                      background: selected ? style.bg : "transparent",
                      border: `1px solid ${selected ? style.border : "rgba(255,255,255,0.1)"}`,
                      color: selected ? style.text : "#64748b",
                    }}
                  >
                    {category.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-8">
            <p className="mb-2 font-mono text-xs tracking-widest text-slate-500">STATUS</p>
            <div className="flex flex-wrap gap-2">
              {(["all", "open", "settled"] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className="rounded-lg px-4 py-2 font-mono text-xs tracking-wider transition-all"
                  style={{
                    background: statusFilter === value ? "rgba(107,63,160,0.3)" : "transparent",
                    border: `1px solid ${
                      statusFilter === value ? "rgba(192,132,252,0.5)" : "rgba(255,255,255,0.1)"
                    }`,
                    color: statusFilter === value ? "#C084FC" : "#64748b",
                  }}
                >
                  {value.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {groupedByCategory.length === 0 ? (
            <div className="py-16 text-center font-mono text-sm text-slate-500">No markets found.</div>
          ) : (
            groupedByCategory.map((group) => {
              const style = CATEGORY_STYLES[group.category];
              return (
                <div key={group.category} className="mb-10">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-display text-2xl tracking-widest" style={{ color: style.text }}>
                      {group.category.toUpperCase()} MARKETS
                    </h3>
                    <p className="font-mono text-xs text-slate-500">
                      {group.markets.length} market{group.markets.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {group.markets.map((market) => (
                      <MarketCard key={market.id} {...market} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </section>

        <footer
          className="border-t py-8 text-center"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <p className="font-mono text-xs tracking-widest text-slate-600">
            Last updated {formatDistanceToNow(new Date(), { addSuffix: true })}
          </p>
        </footer>
      </main>
    </>
  );
}
