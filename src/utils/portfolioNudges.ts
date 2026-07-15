import type { WalletToken } from '../api/walletTypes';
import {
  categoryTotals,
  portfolioTotalUsd,
} from './tokenCategories';

export type NudgePictogram = 'recurringPurchases' | 'ethStaking';

export type PortfolioNudge = {
  id: string;
  title: string;
  description: string;
  pictogram: NudgePictogram;
};

export const CONNECT_NUDGE: PortfolioNudge = {
  id: 'connect',
  title: 'Connect your wallet',
  description: 'Link a wallet to see net worth, allocation, and personal nudges from your holdings.',
  pictogram: 'recurringPurchases',
};

const CONCENTRATION_THRESHOLD = 0.55;
const CHAIN_CONCENTRATION_THRESHOLD = 0.8;
const LOW_STABLES_THRESHOLD = 0.08;
const ETH_STAKING_MIN_USD = 500;
const ETH_STAKING_MIN_SHARE = 0.08;

export function getPortfolioNudges(tokens: WalletToken[]): PortfolioNudge[] {
  if (tokens.length === 0) {
    return [];
  }

  const total = portfolioTotalUsd(tokens);
  if (total <= 0) {
    return [];
  }

  const nudges: PortfolioNudge[] = [];
  const sorted = [...tokens].sort((a, b) => b.valueUsd - a.valueUsd);
  const top = sorted[0];

  if (top && top.valueUsd / total >= CONCENTRATION_THRESHOLD) {
    nudges.push({
      id: 'concentration',
      title: `Heavy ${top.symbol} exposure`,
      description: `${Math.round((top.valueUsd / total) * 100)}% of your portfolio is in ${top.name}. Consider diversifying across categories.`,
      pictogram: 'ethStaking',
    });
  }

  const chainTotals = new Map<string, number>();
  for (const token of tokens) {
    chainTotals.set(token.chain, (chainTotals.get(token.chain) ?? 0) + token.valueUsd);
  }
  const dominantChain = [...chainTotals.entries()].sort((a, b) => b[1] - a[1])[0];
  if (dominantChain && dominantChain[1] / total >= CHAIN_CONCENTRATION_THRESHOLD) {
    nudges.push({
      id: 'chain',
      title: 'Mostly on one chain',
      description: `${Math.round((dominantChain[1] / total) * 100)}% sits on ${dominantChain[0]}. Spreading across chains can reduce bridge and custody risk.`,
      pictogram: 'recurringPurchases',
    });
  }

  const eth = tokens.find((token) => token.symbol.toUpperCase() === 'ETH');
  if (eth && eth.valueUsd >= ETH_STAKING_MIN_USD && eth.valueUsd / total >= ETH_STAKING_MIN_SHARE) {
    nudges.push({
      id: 'eth-staking',
      title: 'ETH could be earning yield',
      description: `You hold ${eth.amount.toFixed(2)} ETH (~${Math.round((eth.valueUsd / total) * 100)}% of net worth). Staking keeps exposure while rewards accrue.`,
      pictogram: 'ethStaking',
    });
  }

  const totals = categoryTotals(tokens);
  const stablesShare = totals.stablecoins / total;
  if (stablesShare < LOW_STABLES_THRESHOLD && totals.layer1 > 0) {
    nudges.push({
      id: 'stables',
      title: 'Low stablecoin buffer',
      description: `Only ${Math.round(stablesShare * 100)}% is in stables. A cash buffer can smooth weekly volatility checks.`,
      pictogram: 'recurringPurchases',
    });
  }

  const defiShare = totals.defi / total;
  if (defiShare >= 0.25 && !nudges.some((n) => n.id === 'concentration')) {
    nudges.push({
      id: 'defi-weight',
      title: 'DeFi-heavy allocation',
      description: `${Math.round(defiShare * 100)}% is in DeFi tokens. Review protocol risk when you rebalance.`,
      pictogram: 'ethStaking',
    });
  }

  const dustTokens = tokens.filter((token) => token.valueUsd / total < 0.02);
  if (dustTokens.length >= 2 && !nudges.some((n) => n.id === 'concentration')) {
    nudges.push({
      id: 'dust',
      title: 'Small positions add noise',
      description: `${dustTokens.length} holdings are each under 2% of net worth. Fewer positions can make weekly check-ins easier.`,
      pictogram: 'recurringPurchases',
    });
  }

  return nudges.slice(0, 3);
}

export function getDominantCategoryLabel(tokens: WalletToken[]): string | null {
  const totals = categoryTotals(tokens);
  const total = portfolioTotalUsd(tokens);
  if (total <= 0) return null;

  const entries = Object.entries(totals) as [keyof typeof totals, number][];
  const top = entries.sort((a, b) => b[1] - a[1])[0];
  if (!top || top[1] / total < 0.4) return null;

  const label =
    top[0] === 'stablecoins' ? 'stablecoins' : top[0] === 'layer1' ? 'Layer 1' : 'DeFi tokens';
  return `${Math.round((top[1] / total) * 100)}% ${label}`;
}
