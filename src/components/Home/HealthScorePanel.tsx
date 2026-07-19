import { useMemo } from 'react';
import { Banner } from '@coinbase/cds-web/banner';
import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import type { Protocol } from '../../api/defillama';
import type { GroupedPoolPosition, WalletToken } from '../../api/walletTypes';
import type { PortfolioHealthScore } from '../../utils/portfolioHealthScore';
import type { BentoInsights } from '../../prompts/portfolioHealthPrompt';
import type { CoachInsight } from '../../utils/coachInsight';
import { demoCoachInsight } from '../../utils/coachInsight';
import {
  computeArcScores,
  computeDailyPerformance,
  computeDeviationMetrics,
  formatSignedPct,
} from '../../utils/bentoHealthMetrics';
import { formatUsd } from '../../utils/format';
import { DEMO_BENTO_CHART, DEMO_HEALTH_SCORE } from '../../data/demoHealthScore';
import { DEMO_POOL_POSITIONS } from '../../data/demoPools';
import { DEMO_WALLET_TOKENS } from '../../data/demoPortfolio';
import type { WalletDataMode } from '../../data/portfolioSnapshot';
import {
  buildRuleCryptoInsight,
  getTrendingProtocols,
} from '../../utils/trendingProtocols';
import { HealthArcGauge } from './HealthArcGauge';
import { DeviationChart } from './DeviationChart';
import { DailyHeatmap } from './DailyHeatmap';
import { AllocationPerformanceCard } from './AllocationPerformanceCard';
import { CryptoInsightsCard } from './CryptoInsightsCard';
import { YieldIdleCard } from './YieldIdleCard';
import { InsightsRollingNumber } from './InsightsRollingNumber';
import './healthBento.css';

const EMPTY_HEALTH_SCORE: PortfolioHealthScore = {
  score: 0,
  grade: 'watch',
  factors: [],
  ruleNarrative: 'No portfolio data yet.',
  vsBtcPct: 0,
  portfolioChangePct: 0,
  drawdownPct: 0,
};

type HealthScorePanelProps = {
  health: PortfolioHealthScore | null;
  loading: boolean;
  dataMode: WalletDataMode;
  missingOpenRouterKey: boolean;
  bentoInsights?: BentoInsights | null;
  coachInsight?: CoachInsight | null;
  walletTokens?: WalletToken[];
  poolPositions?: GroupedPoolPosition[];
  portfolioSeries?: number[];
  btcSeries?: number[] | null;
  rawPortfolioValues?: number[];
  /** Aligned with rawPortfolioValues — daily heatmap. */
  rawTimestamps?: number[];
  /** Aligned with portfolioSeries / btcSeries — deviation axis. */
  timestamps?: number[];
  /** Day-period raw series — hero % for Daily Performance (matches 1D net worth). */
  dayRawValues?: number[];
  dayRawTimestamps?: number[];
  /** True while month/day chart hooks are still fetching. */
  chartsLoading?: boolean;
  protocols?: Protocol[];
  refreshEpoch?: number;
};

function renderInsight(text: string, highlight?: string) {
  if (!highlight || !text.toLowerCase().includes(highlight.toLowerCase())) {
    return text;
  }
  const idx = text.toLowerCase().indexOf(highlight.toLowerCase());
  const before = text.slice(0, idx);
  const mid = text.slice(idx, idx + highlight.length);
  const after = text.slice(idx + highlight.length);
  return (
    <>
      {before}
      <Text color="fg" font="label2">
        {mid}
      </Text>
      {after}
    </>
  );
}

export const HealthScorePanel = ({
  health,
  loading,
  dataMode,
  missingOpenRouterKey,
  bentoInsights = null,
  coachInsight = null,
  walletTokens = [],
  poolPositions = [],
  portfolioSeries = [],
  btcSeries = null,
  rawPortfolioValues = [],
  rawTimestamps = [],
  timestamps = [],
  dayRawValues = [],
  dayRawTimestamps = [],
  chartsLoading = false,
  protocols = [],
  refreshEpoch = 0,
}: HealthScorePanelProps) => {
  const isDemo = dataMode === 'demo';
  const isEmpty = dataMode === 'empty';
  const isLive = dataMode === 'live';

  // Demo only in demo mode — live/empty never inject DEMO_* into charts or book.
  // Live-without-health must not become null (that returned blank after the skeleton).
  const displayHealth = isDemo
    ? DEMO_HEALTH_SCORE
    : isEmpty || !health
      ? EMPTY_HEALTH_SCORE
      : health;
  const tokens = isDemo ? DEMO_WALLET_TOKENS : walletTokens;
  const pools = isDemo ? DEMO_POOL_POSITIONS : poolPositions;
  const yieldInsight = coachInsight ?? (isDemo ? demoCoachInsight() : null);

  const seriesPortfolio = isDemo
    ? DEMO_BENTO_CHART.portfolio
    : portfolioSeries.length >= 2
      ? portfolioSeries
      : [];
  const seriesBtc = isDemo
    ? DEMO_BENTO_CHART.btc
    : btcSeries && btcSeries.length >= 2
      ? btcSeries
      : null;
  const seriesRaw = isDemo
    ? DEMO_BENTO_CHART.raw
    : rawPortfolioValues.length >= 2
      ? rawPortfolioValues
      : [];
  // Prefer dedicated raw timestamps; fall back to overlay axis when lengths match.
  // Only raw timestamps — overlay axis is resampled and must not bucket daily closes.
  const seriesRawTs = isDemo
    ? DEMO_BENTO_CHART.timestamps
    : rawTimestamps.length === seriesRaw.length && rawTimestamps.length >= 2
      ? rawTimestamps
      : [];
  const seriesOverlayTs = isDemo
    ? DEMO_BENTO_CHART.timestamps
    : timestamps.length >= 2
      ? timestamps
      : seriesRawTs;
  // Daily can render from raw USD alone (metrics synth heatmap if timestamps sparse).
  const dailyReady = !isEmpty && seriesRaw.length >= 2;
  const deviationReady =
    !isEmpty && seriesPortfolio.length >= 2 && seriesBtc != null && seriesBtc.length >= 2;

  const ruleArcs = useMemo(
    () =>
      computeArcScores({
        health: displayHealth,
        rawPortfolioValues: seriesRaw,
        walletTokens: tokens,
        poolPositions: pools,
      }),
    [displayHealth, seriesRaw, tokens, pools],
  );

  const arcs = {
    risk: bentoInsights?.risk ?? ruleArcs.risk,
    consistency: bentoInsights?.consistency ?? ruleArcs.consistency,
    diversification: bentoInsights?.diversification ?? ruleArcs.diversification,
  };

  const deviation = useMemo(
    () => computeDeviationMetrics(seriesPortfolio, seriesBtc),
    [seriesPortfolio, seriesBtc],
  );

  const daily = useMemo(() => {
    // Day-chart USD series only — same first→last window as Net worth 1D.
    const heroSource =
      !isDemo && dayRawValues.length >= 2
        ? { values: dayRawValues, timestamps: dayRawTimestamps }
        : undefined;
    return computeDailyPerformance(
      seriesRaw,
      seriesRawTs.length === seriesRaw.length ? seriesRawTs : [],
      heroSource,
    );
  }, [isDemo, seriesRaw, seriesRawTs, dayRawValues, dayRawTimestamps]);

  const trending = useMemo(() => getTrendingProtocols(protocols, 5), [protocols]);
  const ruleCrypto = useMemo(() => buildRuleCryptoInsight(trending), [trending]);

  // Always series-derived copy so the % matches the headline (AI must not invent another figure).
  const deviationCopy = deviation.narrative;
  const dailyCopy = bentoInsights?.dailyInsight ?? daily.insight;
  const dailyHighlight = bentoInsights?.dailyHighlight;
  const cryptoInsight = bentoInsights?.cryptoInsight ?? ruleCrypto.cryptoInsight;
  const cryptoHighlight = bentoInsights?.cryptoHighlight ?? ruleCrypto.cryptoHighlight;

  // Skeleton only while we truly have no score yet — never blank a live dashboard on Refresh.
  if (!isDemo && !health && loading) {
    return (
      <div className="healthBento">
        <div className="healthBento__grid">
          <div className="healthBento__col healthBento__col--left">
            <div className="healthBento__card">
              <div className="healthBento__skeleton" style={{ height: 200 }} />
            </div>
            <div className="healthBento__card">
              <div className="healthBento__skeleton" style={{ height: 100 }} />
            </div>
          </div>
          <div className="healthBento__col healthBento__col--right">
            <div className="healthBento__card">
              <div className="healthBento__skeleton" style={{ height: 160 }} />
            </div>
            <div className="healthBento__card">
              <div className="healthBento__skeleton" style={{ height: 160 }} />
            </div>
            <div className="healthBento__card">
              <div className="healthBento__skeleton" style={{ height: 140 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const changeUp = daily.periodChangePct >= 0;
  const absChangeUsd = Math.abs(daily.periodChangeUsd);
  const noChartCopy = isEmpty
    ? 'No chart data'
    : chartsLoading
      ? 'Waiting on portfolio history…'
      : seriesRaw.length < 2
        ? 'No chart data for this wallet yet — try Refresh.'
        : 'No chart data';
  const noDeviationCopy = isEmpty
    ? 'No chart data'
    : !isLive
      ? 'Connect to compare against BTC.'
      : chartsLoading
        ? 'Waiting on portfolio and BTC series for this window…'
        : seriesPortfolio.length >= 2 && !seriesBtc
          ? 'Portfolio history loaded — BTC benchmark unavailable. Try Refresh.'
          : 'No chart data for this wallet yet — try Refresh.';

  return (
    <div className="healthBento">
      {isLive && missingOpenRouterKey ? (
        <Box marginBottom={2}>
          <Banner startIcon="info" title="AI insights" variant="informational">
            Add VITE_OPENROUTER_API_KEY so AI can score arcs and write performance copy. Charts still
            run from wallet data.
          </Banner>
        </Box>
      ) : null}

      <VStack gap={3} width="100%">
        {!missingOpenRouterKey && isLive ? (
          <Text font="title3">Insights powered by AI</Text>
        ) : null}

        <div className="healthBento__grid">
          <div className="healthBento__col healthBento__col--left">
            <section className="healthBento__card healthBento__card--health">
              <Text font="label1">Portfolio Health</Text>
              <div className="healthBento__healthBody">
                <InsightsRollingNumber
                  formattedValue={String(displayHealth.score)}
                  value={displayHealth.score}
                  zeroFormattedValue="0"
                />
                <div className="healthBento__healthGauge">
                  <HealthArcGauge
                    consistency={arcs.consistency}
                    diversification={arcs.diversification}
                    height={260}
                    risk={arcs.risk}
                    width={400}
                  />
                </div>
              </div>
            </section>

            <section className="healthBento__card healthBento__card--deviation">
              <Text font="label1">Performance Deviation</Text>
              {deviationReady ? (
                <>
                  <InsightsRollingNumber
                    formattedValue={formatSignedPct(deviation.vsBtcPct)}
                    value={deviation.vsBtcPct}
                    zeroFormattedValue={formatSignedPct(0)}
                  />
                  <Text color="fgMuted" font="label2">
                    {deviationCopy}
                  </Text>
                  <div className="healthBento__chartPanel">
                    <HStack alignItems="center" gap={2}>
                      <HStack alignItems="center" gap={0.5}>
                        <span className="healthBento__dot healthBento__dot--yellow" />
                        <Text color="fgMuted" font="caption">
                          BTC
                        </Text>
                      </HStack>
                      <HStack alignItems="center" gap={0.5}>
                        <span className="healthBento__dot healthBento__dot--white" />
                        <Text color="fgMuted" font="caption">
                          Portfolio
                        </Text>
                      </HStack>
                    </HStack>
                    <DeviationChart
                      benchmark={seriesBtc!}
                      maxGapIndex={deviation.maxGapIndex}
                      maxGapPct={deviation.maxGapPct}
                      portfolio={seriesPortfolio}
                      timestamps={seriesOverlayTs}
                    />
                  </div>
                </>
              ) : (
                <Text color="fgMuted" font="label2" paddingTop={1}>
                  {noDeviationCopy}
                </Text>
              )}
            </section>

            <CryptoInsightsCard
              highlight={cryptoHighlight}
              insight={cryptoInsight}
              trending={trending}
            />
          </div>

          <div className="healthBento__col healthBento__col--right">
            <section className="healthBento__card healthBento__card--daily">
              <Text font="label1">Daily Performance</Text>
              {dailyReady ? (
                <>
                  <VStack gap={0} paddingTop={1}>
                    <InsightsRollingNumber
                      color={changeUp ? 'fgPositive' : 'fgNegative'}
                      formattedValue={`${changeUp ? '+' : '−'}${formatUsd(absChangeUsd).replace(/^-/, '')}`}
                      value={absChangeUsd}
                      zeroFormattedValue={`+${formatUsd(0)}`}
                    />
                    <Text
                      className="healthBento__yieldCaption"
                      color={changeUp ? 'fgPositive' : 'fgNegative'}
                      font="label2"
                    >
                      {changeUp ? '+' : '−'}
                      {Math.abs(daily.periodChangePct).toFixed(2)}%
                    </Text>
                  </VStack>
                  <Box paddingTop={1}>
                    <Text color="fgMuted" font="label2">
                      {renderInsight(dailyCopy, dailyHighlight)}
                    </Text>
                  </Box>
                  <DailyHeatmap cells={daily.cells} />
                </>
              ) : (
                <Text color="fgMuted" font="label2" paddingTop={1}>
                  {isDemo ? 'Connect to see daily performance.' : noChartCopy}
                </Text>
              )}
            </section>

            <AllocationPerformanceCard
              dataMode={dataMode}
              poolPositions={poolPositions}
              refreshEpoch={refreshEpoch}
              walletTokens={walletTokens}
            />

            {yieldInsight ? (
              <YieldIdleCard
                matchedApy={yieldInsight.matchedApy}
                matchedDeFiPct={yieldInsight.matchedDeFiPct}
                restPct={yieldInsight.restPct}
                stablesPct={yieldInsight.stablesPct}
              />
            ) : null}
          </div>
        </div>
      </VStack>

      {isDemo ? (
        <Box paddingTop={1.5}>
          <Text color="fgMuted" font="label2">
            Sample — connect wallet for AI-calibrated insights
          </Text>
        </Box>
      ) : null}
    </div>
  );
};
