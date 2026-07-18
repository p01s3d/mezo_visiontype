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

type HealthScorePanelProps = {
  health: PortfolioHealthScore | null;
  loading: boolean;
  isConnected: boolean;
  missingOpenRouterKey: boolean;
  bentoInsights?: BentoInsights | null;
  coachInsight?: CoachInsight | null;
  walletTokens?: WalletToken[];
  poolPositions?: GroupedPoolPosition[];
  portfolioSeries?: number[];
  btcSeries?: number[] | null;
  vsBtcPct?: number | null;
  rawPortfolioValues?: number[];
  timestamps?: number[];
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
  isConnected,
  missingOpenRouterKey,
  bentoInsights = null,
  coachInsight = null,
  walletTokens = [],
  poolPositions = [],
  portfolioSeries = [],
  btcSeries = null,
  vsBtcPct = null,
  rawPortfolioValues = [],
  timestamps = [],
  protocols = [],
  refreshEpoch = 0,
}: HealthScorePanelProps) => {
  const displayHealth = !isConnected ? DEMO_HEALTH_SCORE : health;
  const tokens = !isConnected || walletTokens.length === 0 ? DEMO_WALLET_TOKENS : walletTokens;
  const pools = !isConnected || poolPositions.length === 0 ? DEMO_POOL_POSITIONS : poolPositions;
  const yieldInsight = coachInsight ?? (!isConnected ? demoCoachInsight() : null);

  // Never mix live portfolio with demo BTC — that made the deviation chart lie.
  const seriesPortfolio = !isConnected
    ? DEMO_BENTO_CHART.portfolio
    : portfolioSeries.length >= 2
      ? portfolioSeries
      : [];
  const seriesBtc = !isConnected
    ? DEMO_BENTO_CHART.btc
    : btcSeries && btcSeries.length >= 2
      ? btcSeries
      : null;
  const seriesRaw = !isConnected
    ? DEMO_BENTO_CHART.raw
    : rawPortfolioValues.length >= 2
      ? rawPortfolioValues
      : [];
  const seriesTs = !isConnected
    ? DEMO_BENTO_CHART.timestamps
    : timestamps.length >= 2
      ? timestamps
      : [];
  const vs = !isConnected
    ? DEMO_BENTO_CHART.vsBtcPct
    : vsBtcPct;

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
    () => computeDeviationMetrics(vs, seriesPortfolio, seriesBtc),
    [vs, seriesPortfolio, seriesBtc],
  );

  const daily = useMemo(
    () => computeDailyPerformance(seriesRaw, seriesTs),
    [seriesRaw, seriesTs],
  );

  const trending = useMemo(() => getTrendingProtocols(protocols, 5), [protocols]);
  const ruleCrypto = useMemo(() => buildRuleCryptoInsight(trending), [trending]);

  const deviationCopy = bentoInsights?.deviationNarrative ?? deviation.narrative;
  const dailyCopy = bentoInsights?.dailyInsight ?? daily.insight;
  const dailyHighlight = bentoInsights?.dailyHighlight;
  const cryptoInsight = bentoInsights?.cryptoInsight ?? ruleCrypto.cryptoInsight;
  const cryptoHighlight = bentoInsights?.cryptoHighlight ?? ruleCrypto.cryptoHighlight;

  if (loading && isConnected && !displayHealth) {
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

  if (!displayHealth) return null;

  const changeUp = daily.periodChangePct >= 0;
  const absChangeUsd = Math.abs(daily.periodChangeUsd);

  return (
    <div className="healthBento">
      {isConnected && missingOpenRouterKey ? (
        <Box marginBottom={2}>
          <Banner startIcon="info" title="AI insights" variant="informational">
            Add VITE_OPENROUTER_API_KEY so AI can score arcs and write performance copy. Charts still
            run from wallet data.
          </Banner>
        </Box>
      ) : null}

      <VStack gap={3} width="100%">
        {!missingOpenRouterKey && isConnected ? (
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
              {seriesPortfolio.length >= 2 && seriesBtc && seriesBtc.length >= 2 ? (
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
                      benchmark={seriesBtc}
                      maxGapIndex={deviation.maxGapIndex}
                      maxGapPct={deviation.maxGapPct}
                      portfolio={seriesPortfolio}
                      timestamps={seriesTs}
                    />
                  </div>
                </>
              ) : (
                <Text color="fgMuted" font="label2" paddingTop={1}>
                  {isConnected
                    ? 'Waiting on portfolio and BTC series for this window…'
                    : 'Connect to compare against BTC.'}
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
              <HStack alignItems="center" flexWrap="wrap" gap={1.5} paddingTop={1}>
                <HStack alignItems="baseline" gap={0}>
                  {changeUp ? null : (
                    <Text font="display2">−</Text>
                  )}
                  <InsightsRollingNumber
                    formattedValue={formatUsd(absChangeUsd).replace(/^-/, '')}
                    value={absChangeUsd}
                    zeroFormattedValue={formatUsd(0)}
                  />
                </HStack>
                <span
                  className={`healthBento__changePill ${changeUp ? 'healthBento__changePill--up' : 'healthBento__changePill--down'}`}
                >
                  <HStack alignItems="center" gap={0.5}>
                    <Text font="label2">{changeUp ? '↑' : '↓'}</Text>
                    <InsightsRollingNumber
                      formattedValue={`${Math.abs(daily.periodChangePct).toFixed(2)}%`}
                      font="label2"
                      value={Math.abs(daily.periodChangePct)}
                      zeroFormattedValue="0.00%"
                    />
                  </HStack>
                </span>
              </HStack>
              <Box paddingTop={1}>
                <Text color="fgMuted" font="label2">
                  {renderInsight(dailyCopy, dailyHighlight)}
                </Text>
              </Box>
              <DailyHeatmap cells={daily.cells} />
            </section>

            <AllocationPerformanceCard
              isConnected={isConnected}
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

      {!isConnected ? (
        <Box paddingTop={1.5}>
          <Text color="fgMuted" font="label2">
            Sample — connect wallet for AI-calibrated insights
          </Text>
        </Box>
      ) : null}
    </div>
  );
};
