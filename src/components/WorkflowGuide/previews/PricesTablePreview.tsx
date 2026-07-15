import { Box, Divider, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import type { MarketAsset } from '../../../data/marketAssets';
import { formatPercentChange, formatUsd } from '../../../utils/format';
import { PriceSparkline } from '../../Home/PriceSparkline';
import { TokenIcon } from '../../Home/TokenIcon';

const PREVIEW_ASSETS: MarketAsset[] = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    priceUsd: 91694.54,
    changePct: -4.38,
    iconUrl: 'https://assets.coincap.io/assets/icons/btc@2x.png',
    sparkColor: '#B8764D',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    priceUsd: 3456.12,
    changePct: -3.12,
    iconUrl: 'https://assets.coincap.io/assets/icons/eth@2x.png',
    sparkColor: '#627EEA',
  },
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    priceUsd: 178.42,
    changePct: 2.14,
    iconUrl: 'https://assets.coincap.io/assets/icons/sol@2x.png',
    sparkColor: '#0052FF',
  },
  {
    id: 'usd-coin',
    name: 'USDC',
    symbol: 'USDC',
    priceUsd: 1.0,
    changePct: 0.01,
    iconUrl: 'https://assets.coincap.io/assets/icons/usdc@2x.png',
    sparkColor: '#0052FF',
  },
];

const ROW_GRID = 'minmax(0, 1.4fr) minmax(88px, 1fr) minmax(72px, 1fr) minmax(72px, 1fr)';

function ChangeCell({ changePct }: { changePct: number }) {
  const isDown = changePct < 0;
  const isUp = changePct > 0;
  const color = isDown ? 'fgNegative' : isUp ? 'fgPositive' : 'fgMuted';
  const arrow = isDown ? '↘' : isUp ? '↗' : '→';

  return (
    <Text color={color} font="label2" style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
      {arrow} {formatPercentChange(changePct).replace('+', '')}
    </Text>
  );
}

export function PricesTablePreview() {
  return (
    <VStack gap={0} width="100%">
      <HStack justifyContent="space-between" paddingBottom={1.5} width="100%">
        <Text font="title3">Prices</Text>
        <Text color="fgMuted" font="label2">
          Watchlist
        </Text>
      </HStack>
      <Divider />
      {PREVIEW_ASSETS.map((row, index) => {
        const trend = row.changePct < 0 ? 'down' : row.changePct > 0 ? 'up' : 'flat';
        return (
          <VStack key={row.id} gap={0} width="100%">
            {index > 0 ? <Divider /> : null}
            <Box
              alignItems="center"
              display="grid"
              gap={2}
              paddingY={1.5}
              style={{ gridTemplateColumns: ROW_GRID }}
              width="100%"
            >
              <HStack alignItems="center" gap={1} minWidth={0}>
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
              <Text font="label2" style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                {formatUsd(row.priceUsd)}
              </Text>
              <HStack justifyContent="center" width="100%">
                <PriceSparkline
                  color={row.sparkColor}
                  endValue={row.priceUsd}
                  height={24}
                  seed={row.id}
                  trend={trend}
                  width={72}
                />
              </HStack>
              <ChangeCell changePct={row.changePct} />
            </Box>
          </VStack>
        );
      })}
    </VStack>
  );
}
