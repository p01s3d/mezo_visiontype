import { DataCardWithCircle } from './DataCardWithCircle';
import { RecurringBuyCard } from './RecurringBuyCard';
import { ETHStakingCard } from './ETHStakingCard';
import { WalletSummary } from './WalletSummary';
import { Divider, VStack } from '@coinbase/cds-web/layout';
import type { WalletToken } from '../../api/walletTypes';
import type { YieldPool } from '../../api/defillama';

type CardListProps = {
  pools: YieldPool[];
  loading: boolean;
  totalBalanceUsd: number | null;
  positionCount: number;
  tokenCount: number;
  topToken: WalletToken | null;
  personalLoading: boolean;
};

export const CardList = ({
  pools,
  loading,
  totalBalanceUsd,
  positionCount,
  tokenCount,
  topToken,
  personalLoading,
}: CardListProps) => {
  return (
    <VStack gap={2}>
      <WalletSummary
        totalBalanceUsd={totalBalanceUsd}
        positionCount={positionCount}
        tokenCount={tokenCount}
        topToken={topToken}
        personalLoading={personalLoading}
      />
      <Divider />
      <RecurringBuyCard pools={pools} loading={loading} />
      <Divider />
      <DataCardWithCircle pools={pools} loading={loading} />
      <Divider />
      <ETHStakingCard pools={pools} loading={loading} />
    </VStack>
  );
};
