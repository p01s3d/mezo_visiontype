import { getPercentChangeFromSeries } from './chartData';

/** Rebase a series so the first point is 100 (relative performance). */
export function rebaseTo100(values: number[]): number[] {
  if (values.length === 0) return [];
  const start = values[0];
  // Non-positive start used to map the whole series to 100 (flat line) — that made
  // "vs BTC" equal the portfolio return alone (e.g. +98% with a fake flat BTC).
  if (!(start > 0) || !Number.isFinite(start)) return [];
  return values.map((value) => (value / start) * 100);
}

/** Zerion sometimes returns ms; normalize to unix seconds. */
export function normalizeUnixSeconds(timestamps: number[]): number[] {
  if (timestamps.length === 0) return [];
  const max = Math.max(...timestamps.filter((t) => Number.isFinite(t)));
  if (!Number.isFinite(max)) return timestamps;
  if (max > 1e12) return timestamps.map((t) => t / 1000);
  return timestamps;
}

/** Drop invalid / non-positive points and sort ascending by time. */
function prepareSeries(
  values: number[],
  timestamps: number[],
): { values: number[]; timestamps: number[] } | null {
  const ts = normalizeUnixSeconds(timestamps);
  const n = Math.min(values.length, ts.length);
  const pairs: Array<{ v: number; t: number }> = [];
  for (let i = 0; i < n; i++) {
    // Zerion wallet charts often lead with 0 before the first funded balance.
    // Keeping those zeros collapses rebase-to-100 into a flat fake benchmark.
    if (Number.isFinite(values[i]) && Number.isFinite(ts[i]) && values[i] > 0) {
      pairs.push({ v: values[i], t: ts[i] });
    }
  }
  if (pairs.length < 2) return null;
  pairs.sort((a, b) => a.t - b.t);
  return {
    values: pairs.map((p) => p.v),
    timestamps: pairs.map((p) => p.t),
  };
}

/** Index-point range after rebase-to-100 (0 ⇒ flat / unusable benchmark). */
export function rebasedRange(values: number[]): number {
  if (values.length < 2) return 0;
  let min = values[0];
  let max = values[0];
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return max - min;
}

function sampleEvenly<T>(items: T[], count: number): T[] {
  if (items.length <= count) return items;
  const out: T[] = [];
  for (let i = 0; i < count; i++) {
    const index = Math.round((i / Math.max(count - 1, 1)) * (items.length - 1));
    out.push(items[index]);
  }
  return out;
}

/** Nearest/interpolated value at unix time `t` on a sorted timestamp series. */
export function valueAtTime(values: number[], timestamps: number[], t: number): number {
  const n = Math.min(values.length, timestamps.length);
  if (n === 0) return NaN;
  if (n === 1 || t <= timestamps[0]) return values[0];
  if (t >= timestamps[n - 1]) return values[n - 1];

  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (timestamps[mid] <= t) lo = mid;
    else hi = mid;
  }
  const t0 = timestamps[lo];
  const t1 = timestamps[hi];
  const v0 = values[lo];
  const v1 = values[hi];
  if (t1 === t0) return v0;
  const u = (t - t0) / (t1 - t0);
  return v0 + (v1 - v0) * u;
}

/**
 * Align two series onto a shared time grid over their overlap.
 */
export function alignSeriesByTime(
  aValues: number[],
  aTimestamps: number[],
  bValues: number[],
  bTimestamps: number[],
  maxPoints = 90,
): { a: number[]; b: number[]; timestamps: number[] } | null {
  const aSeries = prepareSeries(aValues, aTimestamps);
  const bSeries = prepareSeries(bValues, bTimestamps);
  if (!aSeries || !bSeries) return null;

  const start = Math.max(aSeries.timestamps[0], bSeries.timestamps[0]);
  const end = Math.min(
    aSeries.timestamps[aSeries.timestamps.length - 1],
    bSeries.timestamps[bSeries.timestamps.length - 1],
  );
  if (!(end > start)) return null;

  const count = Math.max(
    2,
    Math.min(maxPoints, aSeries.timestamps.length, bSeries.timestamps.length, 90),
  );

  const timestamps = Array.from(
    { length: count },
    (_, i) => start + ((end - start) * i) / (count - 1),
  );
  const a = timestamps.map((t) => valueAtTime(aSeries.values, aSeries.timestamps, t));
  const b = timestamps.map((t) => valueAtTime(bSeries.values, bSeries.timestamps, t));
  if (a.some((v) => !Number.isFinite(v)) || b.some((v) => !Number.isFinite(v))) {
    return null;
  }
  return { a, b, timestamps };
}

/**
 * Index-based align (fallback when time windows don't overlap).
 */
export function alignSeries(a: number[], b: number[]): { a: number[]; b: number[] } {
  const target = Math.min(a.length, b.length, 90);
  if (target === 0) return { a: [], b: [] };
  if (a.length === target && b.length === target) return { a, b };
  return { a: sampleEvenly(a, target), b: sampleEvenly(b, target) };
}

export function seriesChangePct(values: number[]): number {
  return getPercentChangeFromSeries(values);
}

/** Portfolio return minus BTC return over a time-aligned window only. */
export function vsBtcDeltaPct(
  portfolioValues: number[],
  btcValues: number[],
  portfolioTimestamps?: number[],
  btcTimestamps?: number[],
): number | null {
  if (portfolioValues.length < 2 || btcValues.length < 2) return null;
  if (
    !portfolioTimestamps ||
    !btcTimestamps ||
    portfolioTimestamps.length !== portfolioValues.length ||
    btcTimestamps.length !== btcValues.length
  ) {
    return null;
  }
  return (
    buildRelativeOverlay(portfolioValues, portfolioTimestamps, btcValues, btcTimestamps)?.vsBtcPct ??
    null
  );
}

export type RelativeOverlay = {
  portfolio: number[];
  btc: number[];
  timestamps: number[];
  vsBtcPct: number;
  /** Only time-aligned overlays are honest enough to chart / cache. */
  alignMode: 'time';
};

/**
 * Build rebased portfolio + BTC overlay.
 * Time alignment only — index pairing is rejected (pairs unrelated dates → fake vs%).
 */
export function buildRelativeOverlay(
  portfolioValues: number[],
  portfolioTimestamps: number[],
  btcValues: number[],
  btcTimestamps: number[],
): RelativeOverlay | null {
  const byTime = alignSeriesByTime(
    portfolioValues,
    portfolioTimestamps,
    btcValues,
    btcTimestamps,
  );

  if (!byTime || byTime.a.length < 2) return null;
  // Interpolation can still yield ≤0 at the grid edge — drop those samples.
  const pairs: Array<{ a: number; b: number; t: number }> = [];
  for (let i = 0; i < byTime.a.length; i++) {
    if (byTime.a[i] > 0 && byTime.b[i] > 0) {
      pairs.push({ a: byTime.a[i], b: byTime.b[i], t: byTime.timestamps[i] });
    }
  }
  if (pairs.length < 2) return null;

  const portfolio = rebaseTo100(pairs.map((p) => p.a));
  const btc = rebaseTo100(pairs.map((p) => p.b));
  if (portfolio.length < 2 || btc.length < 2) return null;

  // Flat BTC after rebase ⇒ bad/zero input, not a real benchmark month.
  if (rebasedRange(btc) < 0.05) return null;

  // End gap on rebased series ≡ return differential (honest single number).
  const vsBtcPct = portfolio[portfolio.length - 1] - btc[btc.length - 1];

  return {
    portfolio,
    btc,
    timestamps: pairs.map((p) => p.t),
    vsBtcPct,
    alignMode: 'time',
  };
}

export function drawdownPct(values: number[]): number {
  if (values.length < 2) return 0;
  let peak = values[0];
  let maxDd = 0;
  for (const value of values) {
    if (value > peak) peak = value;
    if (peak > 0) {
      const dd = ((value - peak) / peak) * 100;
      if (dd < maxDd) maxDd = dd;
    }
  }
  return maxDd;
}
