import type { VerdictCard } from '../types/positionHealth';

export const DEMO_VERDICT_CARDS: VerdictCard[] = [
  {
    id: 'demo-curve-apy',
    label: '3pool LP',
    verdict: 'reduce',
    confidence: 'high',
    headline: 'Curve 3pool yield is fading',
    reasoning:
      'Pool APY dropped sharply while your position shows modest unrealized gains. Fee income may not offset further decay at current yield.',
    opportunity: 'Higher stable yields exist on the same chain if you rebalance.',
    actionUrl: 'https://curve.fi/',
    actionLabel: 'Manage on Curve',
    pictogram: 'ethStaking',
  },
  {
    id: 'demo-eth-concentration',
    label: 'ETH',
    verdict: 'hold',
    confidence: 'medium',
    headline: 'ETH makes up most of net worth',
    reasoning:
      'Over half your portfolio sits in ETH. Consider whether staking or diversification fits your weekly check-in goals.',
    pictogram: 'recurringPurchases',
  },
  {
    id: 'demo-uniswap-opportunity',
    label: 'ETH / USDC',
    verdict: 'hold',
    confidence: 'low',
    headline: 'Uniswap LP still earning fees',
    reasoning:
      'Your ETH/USDC position shows positive unrealized PnL and stable 24h change. No urgent exit signal from current market data.',
    opportunity: 'Alternative stable pools on Ethereum offer slightly higher APY.',
    actionUrl: 'https://app.uniswap.org/positions',
    actionLabel: 'Manage on Uniswap',
    pictogram: 'ethStaking',
  },
];

export const CONNECT_VERDICT_CARD: VerdictCard = {
  id: 'connect',
  label: 'Portfolio',
  verdict: 'hold',
  confidence: 'low',
  headline: 'Connect your wallet',
  reasoning: 'Link a wallet to see AI-powered position health verdicts from your holdings.',
  pictogram: 'recurringPurchases',
};
