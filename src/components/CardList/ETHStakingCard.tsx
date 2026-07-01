import { UpsellCard } from '@coinbase/cds-web/cards';
import { Box } from '@coinbase/cds-web/layout';
import { RemoteImage } from '@coinbase/cds-web/media';
import { Text } from '@coinbase/cds-web/typography';
import type { YieldPool } from '../../api/defillama';
import { formatApy } from '../../utils/format';
import { getTopStakingPool } from '../../utils/defiViews';

type ETHStakingCardProps = {
  pools: YieldPool[];
  loading: boolean;
};

export const ETHStakingCard = ({ pools, loading }: ETHStakingCardProps) => {
  const stakingPool = getTopStakingPool(pools);
  const apyLabel = stakingPool ? formatApy(stakingPool.apy) : '—';

  return (
    <UpsellCard
      style={{ backgroundColor: 'rgb(var(--purple70))' }}
      title={
        <Text as="h3" font="headline" color="fgInverse">
          {loading ? 'Loading staking yields…' : `${apyLabel} APY on ${stakingPool?.symbol ?? 'ETH'}`}
        </Text>
      }
      description={
        <Text as="p" font="label2" color="fgInverse" numberOfLines={3}>
          {loading || !stakingPool
            ? 'Fetching live staking data from DefiLlama.'
            : `${stakingPool.project} on ${stakingPool.chain} · ${formatApy(stakingPool.apy)} current yield`}
        </Text>
      }
      action="View pool"
      media={
        <Box position="relative" left={16} top={12}>
          <RemoteImage source="/staking.png" height={174} />
        </Box>
      }
    />
  );
};
