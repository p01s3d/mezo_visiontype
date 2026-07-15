import { VStack } from '@coinbase/cds-web/layout';
import { DEMO_WALLET_TOKENS } from '../../../data/demoPortfolio';
import { BalanceBreakdown } from '../../Home/BalanceBreakdown';
import { BalanceOverview } from '../../Home/BalanceOverview';

export function HomePreview() {
  return (
    <VStack gap={1.5} minWidth={0} width="100%">
      <BalanceOverview isConnected={false} loading={false} totalBalanceUsd={null} />
      <BalanceBreakdown
        bleedX={0}
        isConnected={false}
        loading={false}
        walletTokens={DEMO_WALLET_TOKENS}
      />
    </VStack>
  );
}
