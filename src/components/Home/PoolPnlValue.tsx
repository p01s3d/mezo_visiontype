import { VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import type { GroupedPoolPosition } from '../../api/walletTypes';
import { formatPercentChange, formatSignedPnlUsd } from '../../utils/format';

type PoolPnlValueProps = {
  pool: GroupedPoolPosition;
  loading?: boolean;
  isConnected?: boolean;
};

export function PoolPnlValue({ pool, loading = false, isConnected = false }: PoolPnlValueProps) {
  if (loading && isConnected) {
    return (
      <Text font="headline" style={{ textAlign: 'right' }}>
        …
      </Text>
    );
  }

  if (pool.unrealizedPnlUsd === null) {
    return (
      <Text font="headline" style={{ textAlign: 'right' }}>
        —
      </Text>
    );
  }

  const isPositive = pool.unrealizedPnlUsd >= 0;
  const color = isPositive ? 'fgPositive' : 'fgNegative';

  return (
    <VStack alignItems="flex-end" gap={0.25} minWidth={0}>
      <Text
        color={color}
        font="headline"
        numberOfLines={1}
        style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}
      >
        {formatSignedPnlUsd(pool.unrealizedPnlUsd)}
      </Text>
      {pool.unrealizedPnlPercent !== null ? (
        <Text
          color={color}
          font="label2"
          numberOfLines={1}
          style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}
        >
          {formatPercentChange(pool.unrealizedPnlPercent)}
        </Text>
      ) : null}
    </VStack>
  );
}
