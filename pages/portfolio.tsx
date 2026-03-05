import React, { useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import { format } from "date-fns";
import Navbar from "../components/Navbar";
import {
  DEMO_POSITIONS,
  calculatePositionPnl,
  getPortfolioSummary,
} from "../utils/program";

function formatSigned(value: number): string {
  const rounded = Math.abs(value).toFixed(2);
  return `${value >= 0 ? "+" : "-"}${rounded} SOL`;
}

export default function PortfolioPage() {
  const summary = useMemo(() => getPortfolioSummary(DEMO_POSITIONS), []);
  const sorted = useMemo(
    () =>
      [...DEMO_POSITIONS].sort(
        (left, right) => right.submittedAt.getTime() - left.submittedAt.getTime()
      ),
    []
  );

  return (
    <>
      <Head>
        <title>Portfolio | Oracle Nexus</title>
      </Head>
      <Navbar />
      <main style={{ minHeight: "100vh", paddingTop: "72px" }}>
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-4xl tracking-widest text-white">PORTFOLIO</h1>
              <p className="font-mono text-xs tracking-wider text-slate-500">
                PNL, position history, and settlement outcomes
              </p>
            </div>
            <Link href="/" className="btn-secondary">
              BACK TO MARKETS
            </Link>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="card p-5">
              <p className="font-mono text-xs text-slate-500">TOTAL STAKED</p>
              <p className="mt-2 font-mono text-xl text-white">{summary.totalStaked.toFixed(2)} SOL</p>
            </div>
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
              <p className="font-mono text-xs text-slate-500">SETTLED</p>
              <p className="mt-2 font-mono text-xl text-white">{summary.settledCount}</p>
            </div>
            <div className="card p-5">
              <p className="font-mono text-xs text-slate-500">WIN RATE</p>
              <p className="mt-2 font-mono text-xl text-white">{summary.winRate.toFixed(1)}%</p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <div
                className="grid px-4 py-3 font-mono text-xs tracking-wider text-slate-500"
                style={{
                  gridTemplateColumns: "1.5fr 0.6fr 0.6fr 0.7fr 0.8fr 0.9fr 0.8fr",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  minWidth: "900px",
                }}
              >
                <span>MARKET</span>
                <span>SIDE</span>
                <span>STAKE</span>
                <span>ENTRY</span>
                <span>MARK</span>
                <span>SUBMITTED</span>
                <span>PNL</span>
              </div>
              {sorted.map((position) => {
                const pnl = calculatePositionPnl(position);
                return (
                  <Link
                    key={position.id}
                    href={`/market/${position.marketId}`}
                    className="grid px-4 py-3 text-sm no-underline transition-colors hover:bg-white/5"
                    style={{
                      gridTemplateColumns: "1.5fr 0.6fr 0.6fr 0.7fr 0.8fr 0.9fr 0.8fr",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      minWidth: "900px",
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
                    <span className="font-mono text-slate-300">{(position.entryOdds * 100).toFixed(1)}%</span>
                    <span className="font-mono text-slate-300">{(position.markOdds * 100).toFixed(1)}%</span>
                    <span className="font-mono text-slate-300">{format(position.submittedAt, "MMM d, yyyy")}</span>
                    <span
                      className="font-mono"
                      style={{ color: pnl >= 0 ? "#34D399" : "#F87171" }}
                    >
                      {formatSigned(pnl)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

