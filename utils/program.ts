import { PublicKey } from "@solana/web3.js";

const DEFAULT_PROGRAM_ID = "9xQeWvG816bUx9EPfM5f6K4M6R4xM3aMcMBXNte1qNbf";

function parsePublicKey(value: string | undefined, fallback: string): PublicKey {
  try {
    return new PublicKey(value ?? fallback);
  } catch {
    return new PublicKey(fallback);
  }
}

export const PROGRAM_ID = parsePublicKey(
  process.env.NEXT_PUBLIC_PREDICTION_MARKET_PROGRAM_ID,
  DEFAULT_PROGRAM_ID
);

export const MARKET_SEED = Buffer.from("market");
export const VAULT_SEED = Buffer.from("vault");
export const POSITION_SEED = Buffer.from("position");
export const REGISTRY_SEED = Buffer.from("registry");

export type MarketStatus = "Open" | "Resolving" | "Settled" | "Cancelled";
export type ResolutionStepStatus = "completed" | "active" | "upcoming";

export interface ResolutionTimelineStep {
  id: string;
  label: string;
  note: string;
  timestamp: Date;
  status: ResolutionStepStatus;
}

export interface DemoMarket {
  id: number;
  title: string;
  description: string;
  resolutionTimestamp: Date;
  status: MarketStatus;
  totalParticipants: number;
  revealedYesStake?: number;
  revealedNoStake?: number;
  outcome?: boolean;
  rules: string[];
  resolutionSource: string;
  timeline: ResolutionTimelineStep[];
}

export interface DemoPosition {
  id: number;
  marketId: number;
  marketTitle: string;
  side: "YES" | "NO";
  stakeSol: number;
  entryOdds: number;
  markOdds: number;
  status: "Open" | "Won" | "Lost";
  submittedAt: Date;
  settledAt?: Date;
  payoutSol?: number;
}

export function getRegistryPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([REGISTRY_SEED], PROGRAM_ID);
}

export function getMarketPDA(marketId: number): [PublicKey, number] {
  const idBuf = Buffer.alloc(8);
  idBuf.writeBigUInt64LE(BigInt(marketId));
  return PublicKey.findProgramAddressSync([MARKET_SEED, idBuf], PROGRAM_ID);
}

export function getVaultPDA(marketId: number): [PublicKey, number] {
  const idBuf = Buffer.alloc(8);
  idBuf.writeBigUInt64LE(BigInt(marketId));
  return PublicKey.findProgramAddressSync([VAULT_SEED, idBuf], PROGRAM_ID);
}

export function getPositionPDA(
  marketPubkey: PublicKey,
  userPubkey: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [POSITION_SEED, marketPubkey.toBuffer(), userPubkey.toBuffer()],
    PROGRAM_ID
  );
}

export const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC ?? "https://api.devnet.solana.com";

export function calculatePositionPnl(position: DemoPosition): number {
  if (position.status === "Open") {
    return (position.markOdds - position.entryOdds) * position.stakeSol;
  }
  return (position.payoutSol ?? 0) - position.stakeSol;
}

export function getPortfolioSummary(positions: DemoPosition[]) {
  const open = positions.filter((position) => position.status === "Open");
  const settled = positions.filter((position) => position.status !== "Open");
  const winners = positions.filter((position) => position.status === "Won");

  const realizedPnl = settled.reduce(
    (total, position) => total + calculatePositionPnl(position),
    0
  );
  const unrealizedPnl = open.reduce(
    (total, position) => total + calculatePositionPnl(position),
    0
  );
  const totalStaked = positions.reduce((total, position) => total + position.stakeSol, 0);
  const winRate = settled.length === 0 ? 0 : (winners.length / settled.length) * 100;

  return {
    openCount: open.length,
    settledCount: settled.length,
    totalStaked,
    realizedPnl,
    unrealizedPnl,
    winRate,
  };
}

export const DEMO_MARKETS: DemoMarket[] = [
  {
    id: 0,
    title: "Will BTC exceed $100k before Q4 2026?",
    description:
      "Resolves YES if Bitcoin spot price on Binance exceeds $100,000 before October 1, 2026.",
    resolutionTimestamp: new Date("2026-10-01"),
    status: "Open",
    totalParticipants: 312,
    rules: [
      "Primary data source is Binance BTC/USDT spot chart.",
      "If Binance data is unavailable for more than 6 hours, Coinbase BTC/USD is fallback.",
      "The first verified price print above $100,000 triggers YES resolution.",
    ],
    resolutionSource: "Binance API with Coinbase fallback",
    timeline: [
      {
        id: "m0_created",
        label: "Market created",
        note: "Question and criteria locked on-chain.",
        timestamp: new Date("2026-02-15T12:00:00Z"),
        status: "completed",
      },
      {
        id: "m0_open",
        label: "Positioning window",
        note: "Encrypted positions accepted.",
        timestamp: new Date("2026-03-01T00:00:00Z"),
        status: "active",
      },
      {
        id: "m0_settle",
        label: "MPC settlement",
        note: "Arcium threshold decryption and final outcome publication.",
        timestamp: new Date("2026-10-01T00:00:00Z"),
        status: "upcoming",
      },
    ],
  },
  {
    id: 1,
    title: "Solana TPS > 10k sustained for 7 days?",
    description:
      "Resolves YES if Solana mainnet sustains over 10,000 non-vote TPS for 7 consecutive days.",
    resolutionTimestamp: new Date("2026-12-31"),
    status: "Open",
    totalParticipants: 178,
    rules: [
      "Metrics sourced from SolanaFM and validator performance dashboard.",
      "Only non-vote transactions are counted.",
      "Sustained period must be continuous and publicly verifiable.",
    ],
    resolutionSource: "SolanaFM + Validator dashboard",
    timeline: [
      {
        id: "m1_created",
        label: "Market created",
        note: "Question and criteria locked on-chain.",
        timestamp: new Date("2026-01-18T09:00:00Z"),
        status: "completed",
      },
      {
        id: "m1_open",
        label: "Positioning window",
        note: "Encrypted positions accepted.",
        timestamp: new Date("2026-02-01T00:00:00Z"),
        status: "active",
      },
      {
        id: "m1_settle",
        label: "MPC settlement",
        note: "Arcium threshold decryption and final outcome publication.",
        timestamp: new Date("2026-12-31T00:00:00Z"),
        status: "upcoming",
      },
    ],
  },
  {
    id: 2,
    title: "Ethereum ETF net inflows > $5B in 2025?",
    description:
      "Resolves YES if spot Ethereum ETFs record cumulative net inflows above $5 billion by December 31, 2025.",
    resolutionTimestamp: new Date("2025-12-31"),
    status: "Settled",
    totalParticipants: 521,
    revealedYesStake: 12_400_000_000,
    revealedNoStake: 8_100_000_000,
    outcome: true,
    rules: [
      "Inflows are calculated from approved ETF issuers' official daily reports.",
      "Net inflows are cumulative over the full year window.",
      "Final tally anchored to public filings and indexer snapshots.",
    ],
    resolutionSource: "Issuer reports + Arcium-verified ingest pipeline",
    timeline: [
      {
        id: "m2_created",
        label: "Market created",
        note: "Question and criteria locked on-chain.",
        timestamp: new Date("2025-01-03T08:00:00Z"),
        status: "completed",
      },
      {
        id: "m2_open",
        label: "Positioning window",
        note: "Encrypted positions accepted.",
        timestamp: new Date("2025-01-10T00:00:00Z"),
        status: "completed",
      },
      {
        id: "m2_settle",
        label: "MPC settlement",
        note: "Outcome published and claims opened.",
        timestamp: new Date("2026-01-02T14:00:00Z"),
        status: "completed",
      },
    ],
  },
  {
    id: 3,
    title: "Will Arcium launch mainnet in 2026?",
    description:
      "Resolves YES if Arcium announces and launches production mainnet by December 31, 2026.",
    resolutionTimestamp: new Date("2026-12-31"),
    status: "Open",
    totalParticipants: 89,
    rules: [
      "Public launch announcement must include production endpoint availability.",
      "Testnet releases do not satisfy resolution criteria.",
      "Arcium release notes and status page are authoritative references.",
    ],
    resolutionSource: "Arcium official release notes + status endpoint",
    timeline: [
      {
        id: "m3_created",
        label: "Market created",
        note: "Question and criteria locked on-chain.",
        timestamp: new Date("2026-02-20T10:30:00Z"),
        status: "completed",
      },
      {
        id: "m3_open",
        label: "Positioning window",
        note: "Encrypted positions accepted.",
        timestamp: new Date("2026-03-01T00:00:00Z"),
        status: "active",
      },
      {
        id: "m3_settle",
        label: "MPC settlement",
        note: "Arcium threshold decryption and final outcome publication.",
        timestamp: new Date("2027-01-01T00:00:00Z"),
        status: "upcoming",
      },
    ],
  },
];

export const DEMO_POSITIONS: DemoPosition[] = [
  {
    id: 1001,
    marketId: 0,
    marketTitle: "Will BTC exceed $100k before Q4 2026?",
    side: "YES",
    stakeSol: 2.8,
    entryOdds: 0.47,
    markOdds: 0.55,
    status: "Open",
    submittedAt: new Date("2026-03-02T09:45:00Z"),
  },
  {
    id: 1002,
    marketId: 1,
    marketTitle: "Solana TPS > 10k sustained for 7 days?",
    side: "NO",
    stakeSol: 1.75,
    entryOdds: 0.36,
    markOdds: 0.34,
    status: "Open",
    submittedAt: new Date("2026-03-01T20:10:00Z"),
  },
  {
    id: 1003,
    marketId: 2,
    marketTitle: "Ethereum ETF net inflows > $5B in 2025?",
    side: "YES",
    stakeSol: 3.2,
    entryOdds: 0.52,
    markOdds: 1,
    status: "Won",
    payoutSol: 5.84,
    submittedAt: new Date("2025-11-06T13:00:00Z"),
    settledAt: new Date("2026-01-02T14:00:00Z"),
  },
  {
    id: 1004,
    marketId: 2,
    marketTitle: "Ethereum ETF net inflows > $5B in 2025?",
    side: "NO",
    stakeSol: 1.25,
    entryOdds: 0.48,
    markOdds: 0,
    status: "Lost",
    payoutSol: 0,
    submittedAt: new Date("2025-10-18T10:05:00Z"),
    settledAt: new Date("2026-01-02T14:00:00Z"),
  },
];
