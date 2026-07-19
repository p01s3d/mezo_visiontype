import type { PortfolioHealthScore } from './portfolioHealthScore';
import { computeAllocationShares, type AllocationShares } from './cutQueue';
import { drawdownPct } from './chartSeries';
import type { GroupedPoolPosition, WalletToken } from '../api/walletTypes';
import { getPercentChangeFromSeries } from './chartData';

export type ArcScores = {
  risk: number;
  consistency: number;
  diversification: number;
};

export type HeatmapCell = {
  /** Day of month 1–31, or null for padding */
  day: number | null;
  /** Daily return %; null = no data / out of month */
  returnPct: number | null;
  inMonth: boolean;
};

export type DailyPerformanceMetrics = {
  periodChangeUsd: number;
  periodChangePct: number;
  insight: string;
  cells: HeatmapCell[];
  monthLabel: string;
};

export type DeviationMetrics = {
  /** Net worth return − BTC return (pp), end of window. */
  vsBtcPct: number;
  portfolioReturnPct: number;
  btcReturnPct: number;
  narrative: string;
  /** Chart badge at the last point. */
  maxGapIndex: number;
  maxGapPct: number;
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function dayOverDayReturns(values: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const prev = values[i - 1];
    if (prev === 0) continue;
    out.push(((values[i] - prev) / prev) * 100);
  }
  return out;
}

/** Higher = more risk (0–1). */
export function computeRiskArc(
  health: PortfolioHealthScore | null,
  rawPortfolioValues: number[],
  topHoldingPct: number,
): number {
  const dd = health?.drawdownPct ?? (rawPortfolioValues.length >= 2 ? drawdownPct(rawPortfolioValues) : 0);
  const ddScore = clamp01(Math.abs(dd) / 25);
  const concScore = clamp01(topHoldingPct / 80);
  const highFactors = health?.factors.filter((f) => f.severity === 'high').length ?? 0;
  const factorScore = clamp01(highFactors / 3);
  return clamp01(ddScore * 0.45 + concScore * 0.35 + factorScore * 0.2);
}

/** Higher = more consistent returns (0–1). */
export function computeConsistencyArc(rawPortfolioValues: number[]): number {
  const returns = dayOverDayReturns(rawPortfolioValues);
  if (returns.length < 3) return 0.55;
  const vol = stdev(returns);
  // ~0% vol → 1, ~8%+ daily vol → 0
  return clamp01(1 - vol / 8);
}

/** Higher = more diversified (0–1). */
export function computeDiversificationArc(allocation: AllocationShares): number {
  const shares = [
    allocation.stablecoins,
    allocation.layer1,
    allocation.defi,
    allocation.lp,
  ].map((s) => s / 100);
  const hhi = shares.reduce((sum, s) => sum + s * s, 0);
  // Single sleeve HHI≈1 → 0; equal 4×0.25 HHI=0.25 → 1
  return clamp01((1 - hhi) / 0.75);
}

export function computeArcScores(input: {
  health: PortfolioHealthScore | null;
  rawPortfolioValues: number[];
  walletTokens: WalletToken[];
  poolPositions: GroupedPoolPosition[];
}): ArcScores {
  const allocation = computeAllocationShares(input.walletTokens, input.poolPositions);
  const top = Math.max(
    allocation.stablecoins,
    allocation.layer1,
    allocation.defi,
    allocation.lp,
  );
  return {
    risk: computeRiskArc(input.health, input.rawPortfolioValues, top),
    consistency: computeConsistencyArc(input.rawPortfolioValues),
    diversification: computeDiversificationArc(allocation),
  };
}

/**
 * Deviation = net worth return vs BTC return on the same rebased window.
 * Chart series are already aligned + rebased to 100 — no extra math.
 */
export function computeDeviationMetrics(
  portfolioSeries: number[],
  btcSeries: number[] | null,
): DeviationMetrics {
  const empty: DeviationMetrics = {
    vsBtcPct: 0,
    portfolioReturnPct: 0,
    btcReturnPct: 0,
    narrative: 'Waiting on portfolio and BTC series for this window…',
    maxGapIndex: 0,
    maxGapPct: 0,
  };

  if (
    portfolioSeries.length < 2 ||
    !btcSeries ||
    btcSeries.length !== portfolioSeries.length
  ) {
    return empty;
  }

  const portfolioReturnPct = portfolioSeries[portfolioSeries.length - 1] - 100;
  const btcReturnPct = btcSeries[btcSeries.length - 1] - 100;
  const vsBtcPct = portfolioReturnPct - btcReturnPct;
  const abs = Math.abs(vsBtcPct);

  const narrative =
    vsBtcPct < 0
      ? `Net worth ${formatSignedPct(portfolioReturnPct)} vs BTC ${formatSignedPct(btcReturnPct)} — behind by ${abs.toFixed(2)}pp this window.`
      : vsBtcPct > 0
        ? `Net worth ${formatSignedPct(portfolioReturnPct)} vs BTC ${formatSignedPct(btcReturnPct)} — ahead by ${abs.toFixed(2)}pp this window.`
        : `Net worth ${formatSignedPct(portfolioReturnPct)} matched BTC ${formatSignedPct(btcReturnPct)} this window.`;

  return {
    vsBtcPct,
    portfolioReturnPct,
    btcReturnPct,
    narrative,
    maxGapIndex: portfolioSeries.length - 1,
    maxGapPct: vsBtcPct,
  };
}

function startOfDayKey(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function changeFromEndpoints(values: number[]): { usd: number; pct: number } {
  if (values.length < 2) return { usd: 0, pct: 0 };
  const first = values[0];
  const last = values[values.length - 1];
  const usd = last - first;
  const pct = first !== 0 ? (usd / first) * 100 : 0;
  return { usd, pct };
}

/**
 * Hero metric for the Daily Performance card: today's move (not month-to-date).
 * Order: intraday today → last day-over-day close → short window series (≤36h).
 */
function heroDailyChange(
  rawValues: number[],
  timestamps: number[],
  dailyCloses: Array<{ day: number; value: number }>,
): { usd: number; pct: number } {
  const aligned =
    rawValues.length >= 2 && timestamps.length === rawValues.length ? timestamps : null;

  if (aligned) {
    const todayKey = startOfDayKey(Date.now() / 1000);
    const todays: number[] = [];
    for (let i = 0; i < rawValues.length; i++) {
      if (startOfDayKey(aligned[i]) === todayKey) todays.push(rawValues[i]);
    }
    if (todays.length >= 2) return changeFromEndpoints(todays);

    const span = aligned[aligned.length - 1] - aligned[0];
    // Day / hour chart window — endpoints are the real "daily" move.
    if (span > 0 && span <= 36 * 3600) return changeFromEndpoints(rawValues);
  }

  if (dailyCloses.length >= 2) {
    const prev = dailyCloses[dailyCloses.length - 2].value;
    const last = dailyCloses[dailyCloses.length - 1].value;
    const usd = last - prev;
    const pct = prev !== 0 ? (usd / prev) * 100 : 0;
    return { usd, pct };
  }

  return { usd: 0, pct: 0 };
}

/** Build calendar heatmap for the current month; hero % is today's change. */
export function computeDailyPerformance(
  rawValues: number[],
  timestamps: number[],
  /** Prefer day-chart series for the hero metric (matches BalanceOverview 1D). */
  heroSource?: { values: number[]; timestamps: number[] },
): DailyPerformanceMetrics {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const byDay = new Map<string, number>();
  if (rawValues.length >= 2 && timestamps.length === rawValues.length) {
    for (let i = 0; i < rawValues.length; i++) {
      byDay.set(startOfDayKey(timestamps[i]), rawValues[i]);
    }
  }

  // Ordered daily closes within current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dailyCloses: Array<{ day: number; value: number }> = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${month}-${day}`;
    const value = byDay.get(key);
    if (value != null) dailyCloses.push({ day, value });
  }

  const dailyReturns = new Map<number, number>();
  for (let i = 1; i < dailyCloses.length; i++) {
    const prev = dailyCloses[i - 1].value;
    const curr = dailyCloses[i].value;
    if (prev !== 0) {
      dailyReturns.set(dailyCloses[i].day, ((curr - prev) / prev) * 100);
    }
  }

  // Hero = 1D net-worth move (same as BalanceOverview / Zerion day chart: first→last).
  // Do NOT slice to calendar-today — that is midnight→now and diverges from the ~24h window.
  // Without a day series, fall back to intraday / last DoD on the month chart (never MTD).
  const hero =
    heroSource && heroSource.values.length >= 2
      ? changeFromEndpoints(heroSource.values)
      : heroDailyChange(rawValues, timestamps, dailyCloses);
  const mtdPct =
    dailyCloses.length >= 2
      ? getPercentChangeFromSeries(dailyCloses.map((c) => c.value))
      : rawValues.length >= 2 && timestamps.length === rawValues.length
        ? getPercentChangeFromSeries(rawValues)
        : hero.pct;

  const firstWeekday = new Date(year, month, 1).getDay(); // 0 Sun
  const cells: HeatmapCell[] = [];

  // Leading padding from previous month
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = 0; i < firstWeekday; i++) {
    const day = prevMonthDays - firstWeekday + 1 + i;
    cells.push({ day, returnPct: null, inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      day,
      returnPct: dailyReturns.has(day) ? dailyReturns.get(day)! : null,
      inMonth: true,
    });
  }

  // Trailing padding to complete weeks
  while (cells.length % 7 !== 0) {
    const day = cells.length % 7 === 0 ? 1 : (cells[cells.length - 1].day ?? 0) + 1;
    cells.push({ day: day > 31 ? day - 31 : day, returnPct: null, inMonth: false });
  }

  const insight = buildDailyInsight(dailyReturns, hero.pct, mtdPct);

  const monthLabel = now.toLocaleString('en-US', { month: 'long' });

  return {
    periodChangeUsd: hero.usd,
    periodChangePct: hero.pct,
    insight,
    cells,
    monthLabel,
  };
}

function buildDailyInsight(
  dailyReturns: Map<number, number>,
  dayChangePct: number,
  mtdChangePct: number,
): string {
  const entries = [...dailyReturns.entries()];
  if (entries.length === 0 && dayChangePct === 0) {
    return 'Not enough daily history yet — connect and wait for chart data.';
  }

  const mid = entries.filter(([d]) => d >= 10 && d <= 20);
  const early = entries.filter(([d]) => d < 10);
  const midAvg =
    mid.length > 0 ? mid.reduce((s, [, r]) => s + r, 0) / mid.length : 0;
  const earlyAvg =
    early.length > 0 ? early.reduce((s, [, r]) => s + r, 0) / early.length : 0;

  if (entries.length >= 4 && mtdChangePct > 0 && midAvg > earlyAvg) {
    return 'Your portfolio saw the strongest gains during mid-month sessions, offsetting early-month volatility.';
  }
  if (dayChangePct < -1 || mtdChangePct < 0) {
    return 'Daily moves were choppy this month — risk and concentration are dragging consistency.';
  }
  if (mtdChangePct > 2 && entries.length >= 4) {
    return 'Steady daily gains compounded through the month with limited giveback.';
  }
  if (Math.abs(dayChangePct) < 0.5) {
    return 'Today is quiet so far — the heatmap shows how the rest of the month has traded.';
  }
  return 'Daily performance was mixed — watch concentration on the largest bags.';
}

export function formatSignedPct(value: number, digits = 2): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}
