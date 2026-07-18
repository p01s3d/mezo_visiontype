import type { Protocol } from './defillama';

const TVL_FLOOR = 5_000_000;

/**
 * Top TVL movers by 1d change — used for Crypto Insights chips + AI grounding.
 */
export function getTrendingProtocols(protocols: Protocol[], limit = 5): Protocol[] {
  return protocols
    .filter(
      (p) =>
        p.tvl >= TVL_FLOOR &&
        p.change1d != null &&
        Number.isFinite(p.change1d) &&
        Math.abs(p.change1d) > 0.5,
    )
    .sort((a, b) => Math.abs(b.change1d ?? 0) - Math.abs(a.change1d ?? 0))
    .slice(0, limit);
}

export function buildRuleCryptoInsight(trending: Protocol[]): {
  cryptoInsight: string;
  cryptoHighlight?: string;
} {
  if (trending.length === 0) {
    return {
      cryptoInsight: 'No standout TVL movers in the current DefiLlama snapshot.',
    };
  }
  const top = trending[0];
  const pct = top.change1d ?? 0;
  const signed = `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
  const direction = pct >= 0 ? 'up' : 'down';
  const highlight = `${top.name} ${signed}`;
  return {
    cryptoInsight: `DefiLlama shows ${top.name} TVL ${direction} ${signed} over 1d — top mover among large protocols.`,
    cryptoHighlight: highlight,
  };
}
