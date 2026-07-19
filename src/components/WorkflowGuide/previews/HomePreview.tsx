import { VStack } from '@coinbase/cds-web/layout';
import { DEMO_NET_WORTH_USD, DEMO_WALLET_TOKENS } from '../../../data/demoPortfolio';
import { DEMO_POOL_POSITIONS } from '../../../data/demoPools';
import { generateSparklineValues } from '../../../utils/chartData';
import { BalanceBreakdown } from '../../Home/BalanceBreakdown';
import { BalanceOverview } from '../../Home/BalanceOverview';

const demoPortfolio = generateSparklineValues('portfolio-3m', 90, DEMO_NET_WORTH_USD, 'up');

export function HomePreview() {
  return (
    <VStack gap={1.5} minWidth={0} width="100%">
      <BalanceOverview
        chartPeriod="day"
        chartValues={demoPortfolio}
        dataMode="demo"
        loading={false}
        portfolioChangePct={4.1}
        totalBalanceUsd={DEMO_NET_WORTH_USD}
      />
      <BalanceBreakdown
        bleedX={0}
        dataMode="demo"
        loading={false}
        poolPositions={DEMO_POOL_POSITIONS}
        walletTokens={DEMO_WALLET_TOKENS}
      />
    </VStack>
  );
}
