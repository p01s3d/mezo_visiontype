import { UpsellCard } from '@coinbase/cds-web/cards';
import { Box } from '@coinbase/cds-web/layout';
import { Pictogram } from '@coinbase/cds-web/illustrations';
import type { YieldPool } from '../../api/defillama';
import { formatApy } from '../../utils/format';
import { getTopLiquidityPool } from '../../utils/defiViews';

type RecurringBuyCardProps = {
  pools: YieldPool[];
  loading: boolean;
};

export const RecurringBuyCard = ({ pools, loading }: RecurringBuyCardProps) => {
  const topPool = getTopLiquidityPool(pools);

  return (
    <UpsellCard
      title="Top liquidity pool"
      description={
        loading || !topPool
          ? 'Loading live pool yields from DefiLlama…'
          : `${topPool.symbol} on ${topPool.project} (${topPool.chain}) is yielding ${formatApy(topPool.apy)} APY.`
      }
      action="Explore pools"
      media={
        <Box position="relative" bottom={6} right={24}>
          <Pictogram dimension="64x64" name="recurringPurchases" />
        </Box>
      }
      onDismissPress={() => {}}
    />
  );
};
