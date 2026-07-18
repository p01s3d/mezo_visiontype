import { getPercentChangeFromSeries } from './chartData';

/** Rebase a series so the first point is 100 (relative performance). */
export function rebaseTo100(values: number[]): number[] {
  if (values.length === 0) return [];
  const start = values[0];
  if (start === 0) return values.map(() => 100);
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

/** Drop invalid points and sort ascending by time. */
function prepareSeries(
  values: number[],
  timestamps: number[],
): { values: number[]; timestamps: number[] } | null {
  const ts = normalizeUnixSeconds(timestamps);
  const n = Math.min(values.length, ts.length);
  const pairs: Array<{ v: number; t: number }> = [];
  for (let i = 0; i < n; i++) {
    if (Number.isFinite(values[i]) && Number.isFinite(ts[i])) {
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

/** Portfolio return minus BTC return over a time-aligned window. */
export function vsBtcDeltaPct(
  portfolioValues: number[],
  btcValues: number[],
  portfolioTimestamps?: number[],
  btcTimestamps?: number[],
): number | null {
  if (portfolioValues.length < 2 || btcValues.length < 2) return null;

  if (
    portfolioTimestamps &&
    btcTimestamps &&
    portfolioTimestamps.length === portfolioValues.length &&
    btcTimestamps.length === btcValues.length
  ) {
    const overlay = buildRelativeOverlay(
      portfolioValues,
      portfolioTimestamps,
      btcValues,
      btcTimestamps,
    );
    if (overlay) return overlay.vsBtcPct;
  }

  const aligned = alignSeries(portfolioValues, btcValues);
  return seriesChangePct(aligned.a) - seriesChangePct(aligned.b);
}

/**
 * Build rebased portfolio + BTC overlay.
 * Prefers time alignment; falls back to index alignment so the chart still loads.
 */
export function buildRelativeOverlay(
  portfolioValues: number[],
  portfolioTimestamps: number[],
  btcValues: number[],
  btcTimestamps: number[],
): { portfolio: number[]; btc: number[]; timestamps: number[]; vsBtcPct: number } | null {
  const byTime = alignSeriesByTime(
    portfolioValues,
    portfolioTimestamps,
    btcValues,
    btcTimestamps,
  );

  if (byTime && byTime.a.length >= 2) {
    return {
      portfolio: rebaseTo100(byTime.a),
      btc: rebaseTo100(byTime.b),
      timestamps: byTime.timestamps,
      vsBtcPct: seriesChangePct(byTime.a) - seriesChangePct(byTime.b),
    };
  }

  // Fallback: index sample + evenly spaced timestamps from portfolio window
  if (portfolioValues.length < 2 || btcValues.length < 2) return null;
  const aligned = alignSeries(portfolioValues, btcValues);
  if (aligned.a.length < 2) return null;

  const prepared = prepareSeries(portfolioValues, portfolioTimestamps);
  let timestamps: number[];
  if (prepared && prepared.timestamps.length >= 2) {
    const start = prepared.timestamps[0];
    const end = prepared.timestamps[prepared.timestamps.length - 1];
    timestamps = Array.from(
      { length: aligned.a.length },
      (_, i) => start + ((end - start) * i) / Math.max(aligned.a.length - 1, 1),
    );
  } else {
    const now = Math.floor(Date.now() / 1000);
    const span = 30 * 86400;
    timestamps = Array.from(
      { length: aligned.a.length },
      (_, i) => now - span + (span * i) / Math.max(aligned.a.length - 1, 1),
    );
  }

  return {
    portfolio: rebaseTo100(aligned.a),
    btc: rebaseTo100(aligned.b),
    timestamps,
    vsBtcPct: seriesChangePct(aligned.a) - seriesChangePct(aligned.b),
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
