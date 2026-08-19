import { HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import { DEMO_BENTO_CHART, DEMO_HEALTH_SCORE } from '../../../data/demoHealthScore';
import { DEMO_POOL_POSITIONS } from '../../../data/demoPools';
import { DEMO_WALLET_TOKENS } from '../../../data/demoPortfolio';
import {
  computeArcScores,
  computeDailyPerformance,
  computeDeviationMetrics,
  formatSignedPct,
} from '../../../utils/bentoHealthMetrics';
import { demoCoachInsight } from '../../../utils/coachInsight';
import { formatUsd } from '../../../utils/format';
import { AllocationPerformanceCard } from '../../Home/AllocationPerformanceCard';
import { CryptoInsightsCard } from '../../Home/CryptoInsightsCard';
import { DeviationChart } from '../../Home/DeviationChart';
import { DailyHeatmap } from '../../Home/DailyHeatmap';
import { HealthArcGauge } from '../../Home/HealthArcGauge';
import { InsightsRollingNumber } from '../../Home/InsightsRollingNumber';
import { YieldIdleCard } from '../../Home/YieldIdleCard';
import '../../Home/healthBento.css';

const BENTO_PREVIEW_STYLE = { overflow: 'hidden' } as const;

const arcs = computeArcScores({
  health: DEMO_HEALTH_SCORE,
  rawPortfolioValues: DEMO_BENTO_CHART.raw,
  walletTokens: DEMO_WALLET_TOKENS,
  poolPositions: DEMO_POOL_POSITIONS,
});

const deviation = computeDeviationMetrics(DEMO_BENTO_CHART.portfolio, DEMO_BENTO_CHART.btc);

const daily = computeDailyPerformance(DEMO_BENTO_CHART.raw, DEMO_BENTO_CHART.timestamps);

const yieldInsight = demoCoachInsight();

export function VerdictsHealthArcPreview() {
  return (
    <div className="healthBento healthBento--guideArc">
      <section className="healthBento__card healthBento__card--health">
        <Text font="label1">Portfolio Health</Text>
        <div className="healthBento__healthBody">
          <InsightsRollingNumber
            formattedValue={String(DEMO_HEALTH_SCORE.score)}
            value={DEMO_HEALTH_SCORE.score}
            zeroFormattedValue="0"
          />
          <div className="healthBento__healthGauge">
            <HealthArcGauge
              consistency={arcs.consistency}
              diversification={arcs.diversification}
              height={240}
              risk={arcs.risk}
              width={400}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export function VerdictsDeviationPreview() {
  return (
    <div className="healthBento" style={BENTO_PREVIEW_STYLE}>
      <section className="healthBento__card healthBento__card--deviation">
        <Text font="label1">Performance Deviation</Text>
        <InsightsRollingNumber
          formattedValue={formatSignedPct(deviation.vsBtcPct)}
          value={deviation.vsBtcPct}
          zeroFormattedValue={formatSignedPct(0)}
        />
        <Text color="fgMuted" font="label2">
          {deviation.narrative}
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
            benchmark={DEMO_BENTO_CHART.btc}
            height={120}
            maxGapIndex={deviation.maxGapIndex}
            maxGapPct={deviation.maxGapPct}
            portfolio={DEMO_BENTO_CHART.portfolio}
            timestamps={DEMO_BENTO_CHART.timestamps}
          />
        </div>
      </section>
    </div>
  );
}

export function VerdictsDailyPreview() {
  const changeUp = daily.periodChangePct >= 0;
  const absChangeUsd = Math.abs(daily.periodChangeUsd);

  return (
    <div className="healthBento" style={BENTO_PREVIEW_STYLE}>
      <section className="healthBento__card healthBento__card--daily">
        <Text font="label1">Daily Performance</Text>
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
        <DailyHeatmap cells={daily.cells} />
      </section>
    </div>
  );
}

export function VerdictsAllocationPreview() {
  return (
    <div className="healthBento" style={BENTO_PREVIEW_STYLE}>
      <AllocationPerformanceCard
        dataMode="demo"
        poolPositions={DEMO_POOL_POSITIONS}
        walletTokens={DEMO_WALLET_TOKENS}
      />
    </div>
  );
}

export function VerdictsCryptoPreview() {
  return (
    <div className="healthBento" style={BENTO_PREVIEW_STYLE}>
      <CryptoInsightsCard
        highlight="Aave V3 +2.4%"
        insight="DefiLlama shows Aave V3 TVL up +2.4% over 1d — top mover among large protocols."
        trending={[]}
      />
    </div>
  );
}

export function VerdictsYieldPreview() {
  return (
    <div className="healthBento" style={BENTO_PREVIEW_STYLE}>
      <YieldIdleCard
        matchedApy={yieldInsight.matchedApy}
        matchedDeFiPct={yieldInsight.matchedDeFiPct}
        restPct={yieldInsight.restPct}
        stablesPct={yieldInsight.stablesPct}
      />
    </div>
  );
}
