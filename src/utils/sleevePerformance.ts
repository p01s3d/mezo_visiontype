import type { GroupedPoolPosition, WalletToken } from '../api/walletTypes';
import { categorizeToken } from './tokenCategories';
import type { AllocationSleeveId } from './cutQueue';

export type SleevePerformance = {
  id: AllocationSleeveId;
  label: string;
  /** Value-weighted return % over the window (null when sleeve empty / no data). */
  returnPct: number | null;
  /**
   * Signed bar extent for diverging viz: −1…0…+1 (midline).
   * Magnitude uses period scale; losses are emphasized (reach full extent sooner).
   */
  barHeight: number;
  valueUsd: number;
};

const SLEEVE_META: Array<{ id: AllocationSleeveId; label: string }> = [
  { id: 'stablecoins', label: 'Stable' },
  { id: 'layer1', label: 'L1' },
  { id: 'defi', label: 'DeFi' },
  { id: 'lp', label: 'LP' },
];

/** Max fungible charts to fetch (Zerion rate limits). */
export const SLEEVE_CHART_ID_LIMIT = 10;

function normalizeBars(rows: Omit<SleevePerformance, 'barHeight'>[]): SleevePerformance[] {
  const maxAbs = Math.max(
    0.01,
    ...rows.map((r) => (r.returnPct == null ? 0 : Math.abs(r.returnPct))),
  );
  return rows.map((r) => ({
    ...r,
    barHeight: r.returnPct == null ? 0 : Math.min(1, Math.abs(r.returnPct) / maxAbs),
  }));
}

/**
 * Full half-bar scale (% return). Tuned so typical moves fill the track:
 * 1D ~±2%, 30D ~±15%, 1Y ~±60%. Losses use a tighter scale (heavier).
 */
export const SLEEVE_BAR_SCALE_PCT = {
  day: 2,
  month: 15,
  year: 60,
} as const;

/** Losses reach full half-height at scale/LOSS_EMPHASIS (asymmetric). */
export const SLEEVE_LOSS_EMPHASIS = 1.45;

/** Minimum half-bar fill for non-flat moves so sub-1% still reads. */
const MIN_BAR_EXTENT = 0.18;

export type SleeveBarPeriod = keyof typeof SLEEVE_BAR_SCALE_PCT;

const FLAT_EPS = 0.05;

/**
 * Signed −1…+1 extent from a return %. Near-zero → 0 (flat midline tick).
 * Negatives use a tighter scale so losses look stronger than equal gains.
 * Non-flat bars get a soft floor so ±0.2–1% aren’t hairlines.
 */
export function signedBarExtent(returnPct: number | null, period: SleeveBarPeriod): number {
  if (returnPct == null || !Number.isFinite(returnPct)) return 0;
  if (Math.abs(returnPct) < FLAT_EPS) return 0;
  const scale = SLEEVE_BAR_SCALE_PCT[period];
  const raw =
    returnPct > 0
      ? Math.min(1, returnPct / scale)
      : Math.min(1, Math.abs(returnPct) / (scale / SLEEVE_LOSS_EMPHASIS));
  const extent = Math.max(MIN_BAR_EXTENT, raw);
  return returnPct > 0 ? extent : -extent;
}

/** Map return % onto signed −1…+1 bar extent (period scale + loss emphasis). */
export function applyPeriodBarScale(
  sleeves: SleevePerformance[],
  period: SleeveBarPeriod,
): SleevePerformance[] {
  return sleeves.map((sleeve) => ({
    ...sleeve,
    barHeight: signedBarExtent(sleeve.returnPct, period),
  }));
}

/** Period return % from a price series (first → last). */
export function seriesReturnPct(values: number[]): number | null {
  if (values.length < 2) return null;
  const start = values[0];
  const end = values[values.length - 1];
  if (!Number.isFinite(start) || !Number.isFinite(end) || start === 0) return null;
  return ((end - start) / start) * 100;
}

/**
 * Pick fungible IDs to chart for ~30d sleeve returns (capped).
 * Prefers highest-value holdings across sleeves + LP legs.
 */
export function selectSleeveChartFungibleIds(
  walletTokens: WalletToken[],
  poolPositions: GroupedPoolPosition[],
  limit = SLEEVE_CHART_ID_LIMIT,
): string[] {
  const candidates: Array<{ id: string; valueUsd: number }> = [];

  for (const token of walletTokens) {
    if (!token.fungibleId || token.valueUsd <= 0) continue;
    candidates.push({ id: token.fungibleId, valueUsd: token.valueUsd });
  }

  for (const pool of poolPositions) {
    for (const leg of pool.legs) {
      if (!leg.fungibleId || leg.valueUsd <= 0) continue;
      candidates.push({ id: leg.fungibleId, valueUsd: leg.valueUsd });
    }
  }

  candidates.sort((a, b) => b.valueUsd - a.valueUsd);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of candidates) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c.id);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * Value-weighted sleeve returns from per-fungible period returns (e.g. 30d charts).
 * Holdings without a return are excluded from the weighted average.
 * Empty sleeves (no value) → null; valued sleeves with no return data → null (not 0).
 */
export function computeSleevePerformanceFromReturns(
  walletTokens: WalletToken[],
  poolPositions: GroupedPoolPosition[],
  returnsByFungibleId: Record<string, number>,
  options?: { usePoolChange24h?: boolean },
): SleevePerformance[] {
  const usePoolChange24h = options?.usePoolChange24h ?? false;
  const buckets: Record<
    AllocationSleeveId,
    { weight: number; weightedReturn: number; valueUsd: number }
  > = {
    stablecoins: { weight: 0, weightedReturn: 0, valueUsd: 0 },
    layer1: { weight: 0, weightedReturn: 0, valueUsd: 0 },
    defi: { weight: 0, weightedReturn: 0, valueUsd: 0 },
    lp: { weight: 0, weightedReturn: 0, valueUsd: 0 },
  };

  for (const token of walletTokens) {
    if (token.valueUsd <= 0) continue;
    const sleeve = categorizeToken(token) as AllocationSleeveId;
    const bucket = buckets[sleeve];
    bucket.valueUsd += token.valueUsd;
    const ret =
      token.fungibleId != null ? returnsByFungibleId[token.fungibleId] : undefined;
    if (ret != null && Number.isFinite(ret)) {
      bucket.weight += token.valueUsd;
      bucket.weightedReturn += ret * token.valueUsd;
    }
  }

  for (const pool of poolPositions) {
    if (pool.valueUsd <= 0) continue;
    const bucket = buckets.lp;
    bucket.valueUsd += pool.valueUsd;

    let legWeight = 0;
    let legWeighted = 0;
    for (const leg of pool.legs) {
      if (leg.valueUsd <= 0 || !leg.fungibleId) continue;
      const ret = returnsByFungibleId[leg.fungibleId];
      if (ret == null || !Number.isFinite(ret)) continue;
      legWeight += leg.valueUsd;
      legWeighted += ret * leg.valueUsd;
    }

    if (legWeight > 0) {
      const poolRet = legWeighted / legWeight;
      bucket.weight += pool.valueUsd;
      bucket.weightedReturn += poolRet * pool.valueUsd;
    } else if (
      usePoolChange24h &&
      pool.change24hPercent != null &&
      Number.isFinite(pool.change24hPercent)
    ) {
      bucket.weight += pool.valueUsd;
      bucket.weightedReturn += pool.change24hPercent * pool.valueUsd;
    }
  }

  const rows = SLEEVE_META.map(({ id, label }) => {
    const b = buckets[id];
    const returnPct = b.weight > 0 ? b.weightedReturn / b.weight : null;
    return { id, label, returnPct, valueUsd: b.valueUsd };
  });

  return normalizeBars(rows);
}

/** 24h sleeve returns from Zerion position `percent_1d` (no chart fetch). */
export function computeSleevePerformance(
  walletTokens: WalletToken[],
  poolPositions: GroupedPoolPosition[],
): SleevePerformance[] {
  const returns: Record<string, number> = {};
  for (const token of walletTokens) {
    if (token.fungibleId && token.change24hPercent != null) {
      returns[token.fungibleId] = token.change24hPercent;
    }
  }
  for (const pool of poolPositions) {
    for (const leg of pool.legs) {
      if (leg.fungibleId && leg.change24hPercent != null) {
        returns[leg.fungibleId] = leg.change24hPercent;
      }
    }
  }
  return computeSleevePerformanceFromReturns(walletTokens, poolPositions, returns, {
    usePoolChange24h: true,
  });
}

/** Demo sleeve returns (disconnected) — scaled per period so the control feels live. */
export const DEMO_SLEEVE_PERFORMANCE: SleevePerformance[] = [
  { id: 'stablecoins', label: 'Stable', returnPct: 0.4, barHeight: 0.05, valueUsd: 520 },
  { id: 'layer1', label: 'L1', returnPct: 8.2, barHeight: 1, valueUsd: 12_213 },
  { id: 'defi', label: 'DeFi', returnPct: -3.6, barHeight: 0.44, valueUsd: 115 },
  { id: 'lp', label: 'LP', returnPct: 4.1, barHeight: 0.5, valueUsd: 2_360 },
];

const DEMO_PERIOD_MULT: Record<SleeveBarPeriod, number> = {
  day: 0.12,
  month: 1,
  year: 3.5,
};

export function demoSleevePerformance(period: SleeveBarPeriod): SleevePerformance[] {
  const mult = DEMO_PERIOD_MULT[period];
  const scaled = DEMO_SLEEVE_PERFORMANCE.map((sleeve) => ({
    ...sleeve,
    returnPct:
      sleeve.returnPct == null ? null : Number((sleeve.returnPct * mult).toFixed(2)),
  }));
  return applyPeriodBarScale(scaled, period);
}
