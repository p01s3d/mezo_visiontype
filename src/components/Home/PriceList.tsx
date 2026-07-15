import { IconButton } from '@coinbase/cds-web/buttons';
import { Box, Divider, HStack, VStack } from '@coinbase/cds-web/layout';
import { Pressable } from '@coinbase/cds-web/system';
import { Text } from '@coinbase/cds-web/typography';
import type { WalletToken } from '../../api/walletTypes';
import type { MarketAsset } from '../../data/marketAssets';
import { formatPercentChange, formatUsd } from '../../utils/format';
import { getTokenIconUrl } from '../../utils/tokenIcon';
import { HomePressableRow, stopRowPress } from './HomePressableRow';
import { PriceSparkline } from './PriceSparkline';
import { TokenIcon } from './TokenIcon';

export type PriceRow = MarketAsset & {
  trend: 'up' | 'down' | 'flat';
  iconUrl: string;
};

type PriceListProps = {
  rows: PriceRow[];
  loading?: boolean;
  emptyMessage?: string;
};

export function tokenToPriceRow(token: WalletToken): PriceRow {
  const changePct = -2.5;
  return {
    id: token.id,
    name: token.name,
    symbol: token.symbol,
    priceUsd: token.price,
    changePct,
    iconUrl: token.logoUrl ?? getTokenIconUrl(token.symbol),
    sparkColor: changePct < 0 ? '#CF202F' : '#0052FF',
    trend: changePct < 0 ? 'down' : changePct > 0 ? 'up' : 'flat',
  };
}

export function marketAssetToPriceRow(asset: MarketAsset): PriceRow {
  return {
    ...asset,
    trend: asset.changePct < 0 ? 'down' : asset.changePct > 0 ? 'up' : 'flat',
  };
}

function ChangeCell({ changePct }: { changePct: number }) {
  const isDown = changePct < 0;
  const isUp = changePct > 0;
  const color = isDown ? 'fgNegative' : isUp ? 'fgPositive' : 'fgMuted';
  const arrow = isDown ? '↘' : isUp ? '↗' : '→';

  return (
    <Text color={color} font="label2" style={{ fontVariantNumeric: 'tabular-nums' }}>
      {arrow} {formatPercentChange(changePct).replace('+', '')}
    </Text>
  );
}

export const PriceList = ({ rows, loading = false, emptyMessage }: PriceListProps) => {
  if (loading && rows.length === 0) {
    return (
      <Text color="fgMuted" font="label2" paddingY={3}>
        {emptyMessage ?? 'Loading market data…'}
      </Text>
    );
  }

  if (rows.length === 0) {
    return emptyMessage ? (
      <Text color="fgMuted" font="label2" paddingY={3}>
        {emptyMessage}
      </Text>
    ) : null;
  }

  return (
    <VStack gap={0} width="100%">
      {rows.map((row, index) => (
        <Box key={row.id} width="100%">
          {index > 0 ? <Divider /> : null}
          <HomePressableRow
            accessibilityLabel={`${row.name}, ${formatUsd(row.priceUsd)}`}
            paddingY={2}
          >
            <HStack alignItems="center" gap={2} width="100%">
              <HStack alignItems="center" flexGrow={1} gap={1.5} minWidth={0}>
                <TokenIcon alt={row.name} source={row.iconUrl} symbol={row.symbol} />
                <VStack gap={0}>
                  <Text font="headline">{row.name}</Text>
                  <Text color="fgMuted" font="label2">
                    {row.symbol}
                  </Text>
                </VStack>
              </HStack>

              <Box flexShrink={0} width={120}>
                <Text font="headline" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatUsd(row.priceUsd)}
                </Text>
              </Box>

              <Box flexShrink={0} width={80}>
                <PriceSparkline
                  color={row.sparkColor}
                  endValue={row.priceUsd}
                  height={28}
                  seed={row.id}
                  trend={row.trend}
                  width={72}
                />
              </Box>

              <Box flexShrink={0} width={72}>
                <ChangeCell changePct={row.changePct} />
              </Box>

              <HStack alignItems="center" flexShrink={0} gap={1.5}>
                <Pressable
                  accessibilityLabel={`Buy ${row.name}`}
                  background="transparent"
                  borderRadius={300}
                  onClick={stopRowPress}
                  paddingX={1}
                  paddingY={0.5}
                >
                  <Text color="fgPrimary" font="label1">
                    Buy
                  </Text>
                </Pressable>
                <IconButton
                  accessibilityLabel="Add to watchlist"
                  active
                  color="fgPrimary"
                  compact
                  iconSize="s"
                  name="star"
                  onClick={stopRowPress}
                  transparent
                  variant="secondary"
                />
                <IconButton
                  accessibilityLabel="Reorder"
                  compact
                  color="fgMuted"
                  iconSize="s"
                  name="drag"
                  onClick={stopRowPress}
                  transparent
                  variant="secondary"
                />
              </HStack>
            </HStack>
          </HomePressableRow>
        </Box>
      ))}
    </VStack>
  );
};
