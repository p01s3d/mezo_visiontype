import type { ChartData } from '@coinbase/cds-common/types/Chart';

function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function generateSparklineValues(
  seed: string,
  points: number,
  endValue: number,
  trend: 'up' | 'down' | 'flat',
): number[] {
  const rand = seededRandom(seed);
  const startValue =
    endValue * (trend === 'up' ? 0.86 : trend === 'down' ? 1.14 : 0.97);
  const data: number[] = [];

  for (let i = 0; i < points; i++) {
    const t = i / Math.max(points - 1, 1);
    const baseline = startValue + (endValue - startValue) * t;
    const wave1 = Math.sin(t * Math.PI * 2.8) * endValue * 0.045;
    const wave2 = Math.sin(t * Math.PI * 7 + rand() * 3) * endValue * 0.025;
    const noise = (rand() - 0.5) * endValue * 0.04;
    data.push(Math.max(baseline + wave1 + wave2 + noise, endValue * 0.05));
  }

  data[data.length - 1] = endValue;
  return data;
}

export function generateFlatBalanceSparkline(total: number, points = 24): number[] {
  const base = total > 0 ? total * 0.92 : 1;
  const data = Array(points - 1).fill(base);
  data.push(total > 0 ? total : base);
  return data;
}

export function generatePortfolioHistory(
  total: number,
  seed = 'portfolio',
  days = 31,
): ChartData {
  const now = Date.now();
  const base = Math.max(total, 1);
  const values = generateSparklineValues(seed, days, base, total > 0 ? 'up' : 'flat');

  return values.map((value, index) => ({
    value,
    date: new Date(now - (values.length - 1 - index) * 24 * 60 * 60 * 1000),
  }));
}

export function getPercentChangeFromSeries(values: number[]): number {
  if (values.length < 2) return 0;
  const start = values[0];
  const end = values[values.length - 1];
  if (start === 0) return 0;
  return ((end - start) / start) * 100;
}

/**
 * Default series stroke = portfolio teal (identity, not PnL).
 * Up/down use fgPositive / fgNegative. Coral is brand UI only.
 */
export const CHART_STROKE_COLOR = 'var(--chart-portfolio, #5db8a6)';
