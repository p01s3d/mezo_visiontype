import type { WalletToken } from '../api/debank';
import { formatChain } from './personalPositions';

export function formatTokenAmount(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(2)}K`;
  if (amount >= 1) return amount.toFixed(4);
  if (amount >= 0.0001) return amount.toFixed(6);
  return amount.toExponential(2);
}

export function filterWalletTokens(tokens: WalletToken[], search: string): WalletToken[] {
  if (!search.trim()) {
    return tokens;
  }

  const query = search.trim().toLowerCase();
  return tokens.filter(
    (token) =>
      token.name.toLowerCase().includes(query) ||
      token.symbol.toLowerCase().includes(query) ||
      token.chain.toLowerCase().includes(query) ||
      formatChain(token.chain).toLowerCase().includes(query),
  );
}
