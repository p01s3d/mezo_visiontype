import { useMemo } from 'react';
import { useSparklinePath } from '@coinbase/cds-common/visualizations/useSparklinePath';
import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import { Sparkline } from '@coinbase/cds-web/visualizations';
import { DEMO_NET_WORTH_USD } from '../../data/demoPortfolio';
import { CHART_STROKE_COLOR, generateSparklineValues } from '../../utils/chartData';
import { formatUsd } from '../../utils/format';

const SPARKLINE_WIDTH = 96;
const SPARKLINE_HEIGHT = 28;

type BalanceOverviewProps = {
  totalBalanceUsd: number | null;
  loading: boolean;
  isConnected: boolean;
};

export const BalanceOverview = ({ totalBalanceUsd, loading, isConnected }: BalanceOverviewProps) => {
  const displayTotal = isConnected ? (totalBalanceUsd ?? 0) : DEMO_NET_WORTH_USD;
  const sparklineValues = useMemo(
    () =>
      generateSparklineValues(
        'portfolio-3m',
        90,
        Math.max(displayTotal, 1),
        displayTotal > 0 ? 'up' : 'flat',
      ),
    [displayTotal],
  );
  const path = useSparklinePath({
    data: sparklineValues,
    height: SPARKLINE_HEIGHT,
    width: SPARKLINE_WIDTH,
  });

  return (
    <VStack gap={0.5} width="100%">
      <HStack alignItems="center" justifyContent="space-between" width="100%">
        <VStack gap={0.25}>
          <Text color="fgMuted" font="label2">
            Net worth
          </Text>
          <Text font="display2">{loading && isConnected ? '…' : formatUsd(displayTotal)}</Text>
        </VStack>
        <Box flexShrink={0}>
          <Sparkline
            color={CHART_STROKE_COLOR}
            fillType="gradientDotted"
            height={SPARKLINE_HEIGHT}
            path={path}
            width={SPARKLINE_WIDTH}
          />
        </Box>
      </HStack>
      {!isConnected ? (
        <Text color="fgMuted" font="label2">
          Sample portfolio — connect wallet to see yours
        </Text>
      ) : null}
    </VStack>
  );
};
