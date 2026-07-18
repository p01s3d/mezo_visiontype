import type { PortfolioHealthScore } from '../utils/portfolioHealthScore';
import { generateSparklineValues } from '../utils/chartData';
import { buildRelativeOverlay } from '../utils/chartSeries';

export const DEMO_HEALTH_SCORE: PortfolioHealthScore = {
  score: 54,
  grade: 'watch',
  factors: [
    {
      id: 'vs_btc_lag',
      label: 'Lagging Bitcoin',
      severity: 'high',
      why: "You're 20.75pp behind holding BTC over this window.",
    },
    {
      id: 'concentration',
      label: 'BTC concentration',
      severity: 'medium',
      why: 'BTC is a large share of net worth.',
    },
    {
      id: 'drawdown',
      label: 'Portfolio drawdown',
      severity: 'medium',
      why: 'Peak-to-trough dipped during mid-year volatility.',
    },
  ],
  ruleNarrative: 'Risk and concentration are elevated versus the BTC benchmark.',
  vsBtcPct: -20.75,
  portfolioChangePct: 5.13,
  drawdownPct: -14.2,
};

function demoTimestamps(count: number): number[] {
  // Trailing ~30 days ending now — historical window, not a forecast
  const end = Math.floor(Date.now() / 1000);
  const start = end - 86400 * 30;
  const step = (end - start) / Math.max(count - 1, 1);
  return Array.from({ length: count }, (_, i) => Math.floor(start + step * i));
}

const raw = generateSparklineValues('bento-port', 60, 12_000, 'up');
const btcRaw = generateSparklineValues('bento-btc', 60, 100, 'up').map((v, i) => v + i * 0.35);
const demoTs = demoTimestamps(raw.length);
const overlay = buildRelativeOverlay(raw, demoTs, btcRaw, demoTs);

export const DEMO_BENTO_CHART = {
  raw,
  portfolio: overlay?.portfolio ?? raw,
  btc: overlay?.btc ?? btcRaw,
  timestamps: overlay?.timestamps ?? demoTs,
  vsBtcPct: overlay?.vsBtcPct ?? -20.75,
};
