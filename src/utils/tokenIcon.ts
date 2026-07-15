const SYMBOL_ICON_URLS: Record<string, string> = {
  BTC: 'https://assets.coincap.io/assets/icons/btc@2x.png',
  ETH: 'https://assets.coincap.io/assets/icons/eth@2x.png',
  USDC: 'https://assets.coincap.io/assets/icons/usdc@2x.png',
  USDT: 'https://assets.coincap.io/assets/icons/usdt@2x.png',
  DAI: 'https://assets.coincap.io/assets/icons/dai@2x.png',
  SOL: 'https://assets.coincap.io/assets/icons/sol@2x.png',
};

export function getTokenIconUrl(symbol: string): string {
  const normalized = symbol.toUpperCase();
  if (SYMBOL_ICON_URLS[normalized]) {
    return SYMBOL_ICON_URLS[normalized];
  }
  return `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`;
}
