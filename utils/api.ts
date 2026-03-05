import type { DemoMarket, DemoPosition, ResolutionTimelineStep } from "./program";

export interface ApiResolutionTimelineStep
  extends Omit<ResolutionTimelineStep, "timestamp"> {
  timestamp: string;
}

export interface ApiMarket extends Omit<DemoMarket, "resolutionTimestamp" | "timeline"> {
  resolutionTimestamp: string;
  timeline: ApiResolutionTimelineStep[];
}

export interface ApiPosition extends Omit<DemoPosition, "submittedAt" | "settledAt"> {
  submittedAt: string;
  settledAt?: string;
}

export function serializeMarket(market: DemoMarket): ApiMarket {
  return {
    ...market,
    resolutionTimestamp: market.resolutionTimestamp.toISOString(),
    timeline: market.timeline.map(serializeTimelineStep),
  };
}

export function serializePosition(position: DemoPosition): ApiPosition {
  return {
    ...position,
    submittedAt: position.submittedAt.toISOString(),
    settledAt: position.settledAt?.toISOString(),
  };
}

export function deserializeMarket(market: ApiMarket): DemoMarket {
  return {
    ...market,
    resolutionTimestamp: new Date(market.resolutionTimestamp),
    timeline: market.timeline.map(deserializeTimelineStep),
  };
}

export function deserializePosition(position: ApiPosition): DemoPosition {
  return {
    ...position,
    submittedAt: new Date(position.submittedAt),
    settledAt: position.settledAt ? new Date(position.settledAt) : undefined,
  };
}

function serializeTimelineStep(step: ResolutionTimelineStep): ApiResolutionTimelineStep {
  return {
    ...step,
    timestamp: step.timestamp.toISOString(),
  };
}

function deserializeTimelineStep(step: ApiResolutionTimelineStep): ResolutionTimelineStep {
  return {
    ...step,
    timestamp: new Date(step.timestamp),
  };
}
