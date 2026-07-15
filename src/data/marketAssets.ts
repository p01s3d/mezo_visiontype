export type MarketAsset = {
  id: string;
  name: string;
  symbol: string;
  priceUsd: number;
  changePct: number;
  iconUrl: string;
  sparkColor: string;
};

export const FEATURED_MARKET_ASSETS: MarketAsset[] = [
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
];
