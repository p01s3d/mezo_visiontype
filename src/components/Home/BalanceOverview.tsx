import { useEffect, useState } from 'react';
import { IconButton } from '@coinbase/cds-web/buttons';
import { Box, Fallback, HStack, VStack } from '@coinbase/cds-web/layout';
import { Pressable } from '@coinbase/cds-web/system';
import { Text } from '@coinbase/cds-web/typography';
import type { ChartPeriod } from '../../api/zerion';
import { DEMO_NET_WORTH_USD } from '../../data/demoPortfolio';
import { useInViewOnce } from '../../hooks/useInViewOnce';
import { ChartPeriodSelector, chartPeriodShortLabel } from './ChartPeriodSelector';
import { CompactLineChart } from './CompactLineChart';
import { AssetPriceLineChart } from './AssetPriceLineChart';
import { RollingPercentChange } from './RollingPercentChange';
import { RollingUsdBalance } from './RollingUsdBalance';
import './balanceOverview.css';

const MINI_CHART_WIDTH = 120;
const MINI_CHART_HEIGHT = 36;
const EXPANDED_CHART_HEIGHT = 220;

const BalanceOverviewSkeleton = ({ expanded }: { expanded: boolean }) => (
  <VStack
    aria-busy
    aria-label="Loading balance"
    gap={expanded ? 2 : 0.5}
    role="status"
    width="100%"
  >
    <HStack alignItems="flex-start" justifyContent="space-between" width="100%">
      <VStack gap={1} minWidth={0}>
        <Text color="fgMuted" font="label2">
          Net worth
        </Text>
        <Fallback disableRandomRectWidth height={expanded ? 40 : 36} width={168} />
        <Fallback disableRandomRectWidth height={14} width={96} />
      </VStack>
      {expanded ? null : (
        <Fallback disableRandomRectWidth height={MINI_CHART_HEIGHT} width={MINI_CHART_WIDTH} />
      )}
    </HStack>
    {expanded ? (
      <Fallback disableRandomRectWidth height={EXPANDED_CHART_HEIGHT} percentage width={100} />
    ) : null}
  </VStack>
);

type BalanceOverviewProps = {
  totalBalanceUsd: number | null;
  loading: boolean;
  isConnected: boolean;
  chartValues?: number[];
  /** Raw USD series for expanded Asset Price chart. */
  rawChartValues?: number[];
  chartTimestamps?: number[];
  portfolioChangePct?: number | null;
  chartLoading?: boolean;
  expanded?: boolean;
  chartPeriod?: ChartPeriod;
  onChartPeriodChange?: (period: ChartPeriod) => void;
  onToggleExpanded?: () => void;
};

export const BalanceOverview = ({
  totalBalanceUsd,
  loading,
  isConnected,
  chartValues = [],
  rawChartValues = [],
  chartTimestamps = [],
  portfolioChangePct = null,
  chartLoading = false,
  expanded = false,
  chartPeriod = 'day',
  onChartPeriodChange,
  onToggleExpanded,
}: BalanceOverviewProps) => {
  const displayTotal = isConnected ? (totalBalanceUsd ?? 0) : DEMO_NET_WORTH_USD;
  const hasChart = chartValues.length >= 2;
  const expandedSeries = rawChartValues.length >= 2 ? rawChartValues : chartValues;
  const periodLabel = chartPeriodShortLabel(chartPeriod);
  const showBalanceSkeleton = loading && isConnected;
  const [rootRef, inView] = useInViewOnce<HTMLDivElement>();
  const [chartRevealed, setChartRevealed] = useState(false);

  useEffect(() => {
    if (!inView || !hasChart || chartLoading) {
      setChartRevealed(false);
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setChartRevealed(true);
      return;
    }
    setChartRevealed(false);
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setChartRevealed(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [inView, hasChart, chartLoading, chartPeriod, expanded]);

  if (showBalanceSkeleton) {
    return <BalanceOverviewSkeleton expanded={expanded} />;
  }

  return (
    <VStack ref={rootRef} gap={expanded ? 2 : 0.5} width="100%">
      <HStack
        alignItems={expanded ? 'flex-start' : 'center'}
        justifyContent="space-between"
        width="100%"
      >
        <VStack gap={0.25} minWidth={0}>
          <Text color="fgMuted" font="label2">
            Net worth
          </Text>
          <RollingUsdBalance font="display2" value={displayTotal} />
          {portfolioChangePct !== null ? (
            <HStack alignItems="center" gap={1}>
              <RollingPercentChange loading={chartLoading} value={portfolioChangePct} />
              <Text color="fgMuted" font="label2">
                {periodLabel}
              </Text>
            </HStack>
          ) : null}
        </VStack>
        {expanded ? (
          onToggleExpanded ? (
            <IconButton
              accessibilityLabel="Collapse chart"
              name="caretUp"
              onClick={onToggleExpanded}
              transparent
            />
          ) : null
        ) : hasChart ? (
          <Pressable accessibilityLabel="Expand balance chart" onClick={onToggleExpanded}>
            <Box
              className={`balanceOverview__miniChartReveal${chartRevealed ? ' is-revealed' : ''}`}
              flexShrink={0}
              style={{ opacity: chartLoading ? 0.7 : undefined }}
            >
              <CompactLineChart
                data={chartValues}
                height={MINI_CHART_HEIGHT}
                showArea
                width={MINI_CHART_WIDTH}
              />
            </Box>
          </Pressable>
        ) : isConnected ? (
          <Fallback
            accessibilityLabel="Loading chart"
            disableRandomRectWidth
            height={MINI_CHART_HEIGHT}
            width={MINI_CHART_WIDTH}
          />
        ) : null}
      </HStack>

      <div
        className={`balanceOverview__chartSlot${expanded ? ' balanceOverview__chartSlot--open' : ''}`}
      >
        <div className="balanceOverview__chartSlotInner">
          <Box
            className={`balanceOverview__expandedChartReveal${expanded && chartRevealed ? ' is-revealed' : ''}`}
            minHeight={EXPANDED_CHART_HEIGHT}
            style={{ opacity: chartLoading && expandedSeries.length >= 2 ? 0.75 : undefined }}
            width="100%"
          >
            {expandedSeries.length >= 2 ? (
              <AssetPriceLineChart
                accessibilityLabel={`Portfolio balance chart for ${periodLabel}`}
                height={EXPANDED_CHART_HEIGHT}
                timestamps={chartTimestamps}
                values={expandedSeries}
              />
            ) : (
              <Fallback
                accessibilityLabel="Loading chart"
                disableRandomRectWidth
                height={EXPANDED_CHART_HEIGHT}
                percentage
                width={100}
              />
            )}
          </Box>

          {onChartPeriodChange ? (
            <ChartPeriodSelector onChange={onChartPeriodChange} value={chartPeriod} />
          ) : null}
        </div>
      </div>

      {!isConnected && !expanded ? (
        <Text color="fgMuted" font="label2">
          Sample portfolio — connect wallet to see yours
        </Text>
      ) : null}
    </VStack>
  );
};
