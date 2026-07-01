import { DataCardWithCircle } from './DataCardWithCircle';
import { RecurringBuyCard } from './RecurringBuyCard';
import { ETHStakingCard } from './ETHStakingCard';
import { WalletSummary } from './WalletSummary';
import { Divider, VStack } from '@coinbase/cds-web/layout';
import type { YieldPool } from '../../api/defillama';

type CardListProps = {
  pools: YieldPool[];
  loading: boolean;
  totalBalanceUsd: number | null;
  positionCount: number;
  personalLoading: boolean;
};

export const CardList = ({
  pools,
  loading,
  totalBalanceUsd,
  positionCount,
  personalLoading,
}: CardListProps) => {
  return (
    <VStack gap={2}>
      <WalletSummary
        totalBalanceUsd={totalBalanceUsd}
        positionCount={positionCount}
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
