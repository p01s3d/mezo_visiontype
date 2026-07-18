import { useMemo, useState } from 'react';
import { SelectOption } from '@coinbase/cds-web/controls';
import { Dropdown } from '@coinbase/cds-web/dropdown';
import { HStack, VStack } from '@coinbase/cds-web/layout';
import { Pressable } from '@coinbase/cds-web/system';
import { Text } from '@coinbase/cds-web/typography';
import { Icon } from '@coinbase/cds-web/icons';
import type { WalletToken } from '../../api/walletTypes';
import { FEATURED_MARKET_ASSETS } from '../../data/marketAssets';
import { categorizeToken } from '../../utils/tokenCategories';
import { useFungibleCharts } from '../../hooks/useFungibleCharts';
import { marketAssetToPriceRow, PriceList, tokenToPriceRow, type PriceRow } from './PriceList';

type WatchlistFilter = 'watchlist' | 'all';

type PricesSectionProps = {
  walletTokens: WalletToken[];
  isConnected: boolean;
  loading: boolean;
  refreshEpoch?: number;
};

export const PricesSection = ({
  walletTokens,
  isConnected,
  loading,
  refreshEpoch = 0,
}: PricesSectionProps) => {
  const [watchlist, setWatchlist] = useState<WatchlistFilter>('watchlist');
  const watchlistLabel = watchlist === 'watchlist' ? 'Watchlist' : 'All assets';

  const topTokens = useMemo(
    () =>
      isConnected && walletTokens.length > 0
        ? walletTokens.filter((token) => categorizeToken(token) !== 'stablecoins').slice(0, 5)
        : [],
    [isConnected, walletTokens],
  );

  const fungibleIds = useMemo(
    () => topTokens.map((token) => token.fungibleId).filter((id): id is string => Boolean(id)),
    [topTokens],
  );

  const { chartsByFungibleId, loading: chartsLoading } = useFungibleCharts(
    fungibleIds,
    isConnected && fungibleIds.length > 0,
    refreshEpoch,
  );

  const rows = useMemo<PriceRow[]>(() => {
    if (topTokens.length > 0) {
      return topTokens.map((token) => {
        const chart = token.fungibleId ? chartsByFungibleId[token.fungibleId] : undefined;
        return tokenToPriceRow(token, chart ?? null);
      });
    }
    return FEATURED_MARKET_ASSETS.map(marketAssetToPriceRow);
  }, [topTokens, chartsByFungibleId]);

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

      <PriceList loading={loading || chartsLoading} rows={rows} />
    </VStack>
  );
};
