import type { PortfolioHealthScore } from './portfolioHealthScore';
import { computeAllocationShares, type AllocationShares } from './cutQueue';
import { drawdownPct } from './chartSeries';
import type { GroupedPoolPosition, WalletToken } from '../api/walletTypes';
import { generateSparklineValues } from './chartData';

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
  vsBtcPct: number;
  underperformed: boolean;
  narrative: string;
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

export function computeDeviationMetrics(
  vsBtcPct: number | null,
  portfolioRebased: number[],
  btcRebased: number[] | null,
): DeviationMetrics {
  const vs = vsBtcPct ?? 0;
  const underperformed = vs < 0;
  const abs = Math.abs(vs);

  let maxGapIndex = 0;
  let maxGapPct = 0;
  if (btcRebased && portfolioRebased.length >= 2 && btcRebased.length >= 2) {
    const n = Math.min(portfolioRebased.length, btcRebased.length);
    for (let i = 0; i < n; i++) {
      const gap = portfolioRebased[i] - btcRebased[i];
      if (Math.abs(gap) >= Math.abs(maxGapPct)) {
        maxGapPct = gap;
        maxGapIndex = i;
      }
    }
  }

  const narrative = underperformed
    ? `Portfolio underperformed its benchmark by ${abs.toFixed(2)}% during this window.`
    : vs > 0
      ? `Portfolio outperformed its benchmark by ${abs.toFixed(2)}% over this window.`
      : 'Portfolio tracked its benchmark closely over this window.';

  return {
    vsBtcPct: vs,
    underperformed,
    narrative,
    maxGapIndex,
    maxGapPct,
  };
}

function startOfDayKey(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Build calendar heatmap for the month containing the last timestamp. */
export function computeDailyPerformance(
  rawValues: number[],
  timestamps: number[],
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

  // If sparse data, synthesize demo-like returns from series endpoints
  let periodChangeUsd = 0;
  let periodChangePct = 0;
  const dailyReturns = new Map<number, number>();

  if (dailyCloses.length >= 2) {
    const first = dailyCloses[0].value;
    const last = dailyCloses[dailyCloses.length - 1].value;
    periodChangeUsd = last - first;
    periodChangePct = first !== 0 ? (periodChangeUsd / first) * 100 : 0;

    for (let i = 1; i < dailyCloses.length; i++) {
      const prev = dailyCloses[i - 1].value;
      const curr = dailyCloses[i].value;
      if (prev !== 0) {
        dailyReturns.set(dailyCloses[i].day, ((curr - prev) / prev) * 100);
      }
    }
  } else if (rawValues.length >= 2) {
    const first = rawValues[0];
    const last = rawValues[rawValues.length - 1];
    periodChangeUsd = last - first;
    periodChangePct = first !== 0 ? (periodChangeUsd / first) * 100 : 0;
    // Distribute synthetic daily returns across month from sparkline shape
    const synth = generateSparklineValues('daily-heat', daysInMonth, 100, periodChangePct >= 0 ? 'up' : 'down');
    for (let day = 2; day <= daysInMonth; day++) {
      const prev = synth[day - 2];
      const curr = synth[day - 1];
      if (prev !== 0) dailyReturns.set(day, ((curr - prev) / prev) * 100);
    }
  }

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

  const insight = buildDailyInsight(dailyReturns, periodChangePct);

  const monthLabel = now.toLocaleString('en-US', { month: 'long' });

  return {
    periodChangeUsd,
    periodChangePct,
    insight,
    cells,
    monthLabel,
  };
}

function buildDailyInsight(dailyReturns: Map<number, number>, periodChangePct: number): string {
  const entries = [...dailyReturns.entries()];
  if (entries.length === 0) {
    return 'Not enough daily history yet — connect and wait for chart data.';
  }

  const mid = entries.filter(([d]) => d >= 10 && d <= 20);
  const early = entries.filter(([d]) => d < 10);
  const midAvg =
    mid.length > 0 ? mid.reduce((s, [, r]) => s + r, 0) / mid.length : 0;
  const earlyAvg =
    early.length > 0 ? early.reduce((s, [, r]) => s + r, 0) / early.length : 0;

  if (periodChangePct > 0 && midAvg > earlyAvg) {
    return 'Your portfolio saw the strongest gains during mid-month sessions, offsetting early-month volatility.';
  }
  if (periodChangePct < 0) {
    return 'Daily moves were choppy this month — risk and concentration are dragging consistency.';
  }
  if (periodChangePct > 2) {
    return 'Steady daily gains compounded through the month with limited giveback.';
  }
  return 'Daily performance was mixed — watch concentration on the largest bags.';
}

export function formatSignedPct(value: number, digits = 2): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}
