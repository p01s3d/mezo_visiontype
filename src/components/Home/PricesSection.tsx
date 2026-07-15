import { useMemo, useState } from 'react';
import { SelectOption } from '@coinbase/cds-web/controls';
import { Dropdown } from '@coinbase/cds-web/dropdown';
import { Divider, HStack, VStack } from '@coinbase/cds-web/layout';
import { Pressable } from '@coinbase/cds-web/system';
import { Text } from '@coinbase/cds-web/typography';
import { Icon } from '@coinbase/cds-web/icons';
import type { WalletToken } from '../../api/walletTypes';
import { FEATURED_MARKET_ASSETS } from '../../data/marketAssets';
import { marketAssetToPriceRow, PriceList, tokenToPriceRow, type PriceRow } from './PriceList';

type WatchlistFilter = 'watchlist' | 'all';

type PricesSectionProps = {
  walletTokens: WalletToken[];
  isConnected: boolean;
  loading: boolean;
};

export const PricesSection = ({ walletTokens, isConnected, loading }: PricesSectionProps) => {
  const [watchlist, setWatchlist] = useState<WatchlistFilter>('watchlist');
  const watchlistLabel = watchlist === 'watchlist' ? 'Watchlist' : 'All assets';

  const rows = useMemo<PriceRow[]>(() => {
    if (isConnected && walletTokens.length > 0) {
      return walletTokens.slice(0, 5).map(tokenToPriceRow);
    }
    return FEATURED_MARKET_ASSETS.map(marketAssetToPriceRow);
  }, [isConnected, walletTokens]);

  return (
    <VStack gap={0} paddingX={2} paddingY={2} width="100%">
      <HStack alignItems="center" justifyContent="space-between" paddingBottom={1.5} width="100%">
        <Text font="title3">Prices</Text>
        <Dropdown
          content={
            <VStack>
              <SelectOption
                onClick={() => setWatchlist('watchlist')}
                title="Watchlist"
                value="watchlist"
              />
              <SelectOption onClick={() => setWatchlist('all')} title="All assets" value="all" />
            </VStack>
          }
          onChange={(value: string) => setWatchlist(value as WatchlistFilter)}
          value={watchlist}
          width={180}
        >
          <Pressable background="bgAlternate" borderRadius={1000} paddingX={2} paddingY={1}>
            <HStack alignItems="center" gap={1}>
              <Text font="headline">{watchlistLabel}</Text>
              <Icon active color="fg" name="caretDown" size="s" />
            </HStack>
          </Pressable>
        </Dropdown>
      </HStack>

      <Divider />

      <PriceList loading={loading} rows={rows} />
    </VStack>
  );
};
