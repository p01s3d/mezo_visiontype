type DexLinkInput = {
  protocol: string;
  chain: string;
  poolAddress?: string | null;
  protocolSlug?: string | null;
  protocolUrl?: string | null;
};

const EXPLORER_BY_CHAIN: Record<string, string> = {
  ethereum: 'https://etherscan.io/address/',
  arbitrum: 'https://arbiscan.io/address/',
  optimism: 'https://optimistic.etherscan.io/address/',
  polygon: 'https://polygonscan.com/address/',
  avalanche: 'https://snowtrace.io/address/',
  bsc: 'https://bscscan.com/address/',
  base: 'https://basescan.org/address/',
};

const PROTOCOL_URLS: Record<string, string | ((chain: string) => string)> = {
  uniswap: 'https://app.uniswap.org/positions',
  'uniswap v3': 'https://app.uniswap.org/positions',
  'uniswap v2': 'https://app.uniswap.org/pool',
  curve: 'https://curve.fi/',
  aave: 'https://app.aave.com/',
  'aave v3': 'https://app.aave.com/',
  balancer: 'https://app.balancer.fi/',
  'balancer v2': 'https://app.balancer.fi/',
  compound: 'https://app.compound.finance/',
  lido: 'https://stake.lido.fi/',
  convex: 'https://www.convexfinance.com/stake',
  yearn: 'https://yearn.fi/vaults',
  pendle: 'https://app.pendle.finance/trade/markets',
  sushiswap: 'https://www.sushi.com/pool',
  pancakeswap: 'https://pancakeswap.finance/liquidity',
};

function normalizeProtocolKey(protocol: string): string {
  return protocol.toLowerCase().trim();
}

function protocolDisplayName(protocol: string): string {
  return protocol.replace(/\s+v?\d+(\.\d+)?$/i, '').trim() || protocol;
}

export function resolveDexUrl(input: DexLinkInput): { url: string; label: string } | null {
  const { protocol, chain, poolAddress, protocolSlug, protocolUrl } = input;

  if (protocolUrl) {
    return {
      url: protocolUrl,
      label: `Manage on ${protocolDisplayName(protocol)}`,
    };
  }

  const key = normalizeProtocolKey(protocol);
  const staticUrl = PROTOCOL_URLS[key];
  if (staticUrl) {
    const url = typeof staticUrl === 'function' ? staticUrl(chain) : staticUrl;
    return { url, label: `Manage on ${protocolDisplayName(protocol)}` };
  }

  for (const [mapKey, url] of Object.entries(PROTOCOL_URLS)) {
    if (key.includes(mapKey) || mapKey.includes(key)) {
      const resolved = typeof url === 'function' ? url(chain) : url;
      return { url: resolved, label: `Manage on ${protocolDisplayName(protocol)}` };
    }
  }

  if (protocolSlug) {
    return {
      url: `https://defillama.com/protocol/${protocolSlug}`,
      label: `View ${protocolDisplayName(protocol)} on DefiLlama`,
    };
  }

  const explorer = EXPLORER_BY_CHAIN[chain.toLowerCase()];
  if (poolAddress && explorer) {
    return {
      url: `${explorer}${poolAddress}`,
      label: 'View pool on explorer',
    };
  }

  return null;
}

export function attachDexLink<T extends { protocol: string; chain: string; verdict: string }>(
  verdict: T,
  linkInput: Omit<DexLinkInput, 'protocol' | 'chain'>,
): T & { actionUrl?: string; actionLabel?: string } {
  if (verdict.verdict === 'hold') {
    return verdict;
  }

  const resolved = resolveDexUrl({
    protocol: verdict.protocol,
    chain: verdict.chain,
    ...linkInput,
  });

  if (!resolved) return verdict;

  return {
    ...verdict,
    actionUrl: resolved.url,
    actionLabel: resolved.label,
  };
}
