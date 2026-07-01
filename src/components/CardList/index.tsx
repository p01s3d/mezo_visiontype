import { DataCardWithCircle } from './DataCardWithCircle';
import { RecurringBuyCard } from './RecurringBuyCard';
import { ETHStakingCard } from './ETHStakingCard';
import { WalletSummary } from './WalletSummary';
import { Divider, VStack } from '@coinbase/cds-web/layout';
import type { YieldPool } from '../../api/defillama';

type CardListProps = {
  pools: YieldPool[];
  loading: boolean;
};

export const CardList = ({ pools, loading }: CardListProps) => {
  return (
    <VStack gap={2}>
      <WalletSummary />
      <Divider />
      <RecurringBuyCard pools={pools} loading={loading} />
      <Divider />
      <DataCardWithCircle pools={pools} loading={loading} />
      <Divider />
      <ETHStakingCard pools={pools} loading={loading} />
    </VStack>
  );
};
