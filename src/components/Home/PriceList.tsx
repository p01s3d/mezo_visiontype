import { IconButton } from '@coinbase/cds-web/buttons';
import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
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
  fungibleId?: string | null;
  chartSeries?: number[] | null;
};

type PriceListProps = {
  rows: PriceRow[];
  loading?: boolean;
  emptyMessage?: string;
};

const PRICE_GRID = 'minmax(0, 1.6fr) minmax(0, 1fr) minmax(72px, 0.9fr) auto';
const rowGridStyle = { gridTemplateColumns: PRICE_GRID } as const;

export function tokenToPriceRow(
  token: WalletToken,
  chart?: { values: number[]; changePct: number } | null,
): PriceRow {
  const changePct = chart?.changePct ?? 0;
  return {
    id: token.id,
    name: token.name,
    symbol: token.symbol,
    priceUsd: token.price,
    changePct,
    iconUrl: token.logoUrl ?? getTokenIconUrl(token.symbol),
    sparkColor:
      changePct < 0
        ? 'var(--color-fgNegative, #c64545)'
        : 'var(--color-fgPositive, #2f7a4a)',
    trend: changePct < 0 ? 'down' : changePct > 0 ? 'up' : 'flat',
    fungibleId: token.fungibleId,
    chartSeries: chart?.values ?? null,
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
    <Text
      color={color}
      font="label2"
      style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}
    >
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
      {rows.map((row) => (
        <Box key={row.id} width="100%">
          <HomePressableRow
            accessibilityLabel={`${row.name}, ${formatUsd(row.priceUsd)}`}
            paddingY={2}
          >
            <Box alignItems="center" display="grid" gap={2} style={rowGridStyle} width="100%">
              <HStack alignItems="center" gap={1.5} minWidth={0}>
                <TokenIcon alt={row.name} source={row.iconUrl} symbol={row.symbol} />
                <VStack gap={0} minWidth={0}>
                  <Text font="headline" numberOfLines={1}>
                    {row.name}
                  </Text>
                  <Text color="fgMuted" font="label2">
                    {row.symbol}
                  </Text>
                </VStack>
              </HStack>

              <VStack alignItems="flex-end" gap={0} minWidth={0}>
                <Text font="headline" style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                  {formatUsd(row.priceUsd)}
                </Text>
                <ChangeCell changePct={row.changePct} />
              </VStack>

              <HStack justifyContent="flex-end" width="100%">
                <PriceSparkline
                  color={row.sparkColor}
                  endValue={row.priceUsd}
                  height={28}
                  seed={row.id}
                  series={row.chartSeries}
                  trend={row.trend}
                  width={72}
                />
              </HStack>

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
            </Box>
          </HomePressableRow>
        </Box>
      ))}
    </VStack>
  );
};
