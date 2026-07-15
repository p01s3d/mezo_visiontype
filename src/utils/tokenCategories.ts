import type { WalletToken } from '../api/walletTypes';

export type TokenCategory = 'stablecoins' | 'layer1' | 'defi';

const STABLECOIN_SYMBOLS = new Set([
  'USDC',
  'USDT',
  'DAI',
  'USDS',
  'FRAX',
  'LUSD',
  'GUSD',
  'BUSD',
  'USDE',
  'PYUSD',
]);

const LAYER1_SYMBOLS = new Set([
  'BTC',
  'ETH',
  'SOL',
  'BNB',
  'AVAX',
  'MATIC',
  'POL',
  'ADA',
  'DOT',
  'ATOM',
  'NEAR',
  'APT',
  'SUI',
  'TON',
  'XRP',
  'LTC',
  'BCH',
  'DOGE',
]);

export const TOKEN_CATEGORY_LABELS: Record<TokenCategory, string> = {
  stablecoins: 'Stablecoins',
  layer1: 'Layer 1',
  defi: 'DeFi tokens',
};

export const TOKEN_CATEGORY_TAB_LABELS: Record<TokenCategory, string> = {
  stablecoins: 'Cash',
  layer1: 'Crypto',
  defi: 'DeFi',
};

export const TOKEN_CATEGORY_ORDER: TokenCategory[] = ['stablecoins', 'layer1', 'defi'];

export function categorizeToken(token: WalletToken): TokenCategory {
  const symbol = token.symbol.toUpperCase();
  if (STABLECOIN_SYMBOLS.has(symbol)) return 'stablecoins';
  if (LAYER1_SYMBOLS.has(symbol)) return 'layer1';
  return 'defi';
}

export function groupTokensByCategory(tokens: WalletToken[]): Record<TokenCategory, WalletToken[]> {
  const groups: Record<TokenCategory, WalletToken[]> = {
    stablecoins: [],
    layer1: [],
    defi: [],
  };

  for (const token of tokens) {
    groups[categorizeToken(token)].push(token);
  }

  for (const category of TOKEN_CATEGORY_ORDER) {
    groups[category].sort((a, b) => b.valueUsd - a.valueUsd);
  }

  return groups;
}

export function categoryTotals(tokens: WalletToken[]): Record<TokenCategory, number> {
  const groups = groupTokensByCategory(tokens);
  return {
    stablecoins: sumValue(groups.stablecoins),
    layer1: sumValue(groups.layer1),
    defi: sumValue(groups.defi),
  };
}

function sumValue(tokens: WalletToken[]): number {
  return tokens.reduce((total, token) => total + token.valueUsd, 0);
}

export function portfolioTotalUsd(tokens: WalletToken[]): number {
  return sumValue(tokens);
}
