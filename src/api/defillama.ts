export type YieldPool = {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyPct1D: number | null;
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
};

export type Protocol = {
  id: string;
  name: string;
  category: string;
  chain: string;
  tvl: number;
  slug: string;
  change1d: number | null;
  change7d: number | null;
  logo: string | null;
};

type YieldPoolsResponse = {
  status: string;
  data: YieldPool[];
};

const YIELD_POOLS_URL = 'https://yields.llama.fi/pools';
const PROTOCOLS_URL = 'https://api.llama.fi/protocols';

export async function fetchYieldPools(): Promise<YieldPool[]> {
  const response = await fetch(YIELD_POOLS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch yield pools (${response.status})`);
  }

  const json = (await response.json()) as YieldPoolsResponse;
  return json.data.filter((pool) => pool.tvlUsd > 0 && pool.apy > 0);
}

export async function fetchProtocols(): Promise<Protocol[]> {
  const response = await fetch(PROTOCOLS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch protocols (${response.status})`);
  }

  const json = (await response.json()) as Array<{
    id: string;
    name: string;
    category: string;
    chain: string;
    tvl: number;
    slug: string;
    change_1d?: number | null;
    change_7d?: number | null;
    logo?: string | null;
  }>;

  return json
    .filter((protocol) => protocol.tvl > 0 && protocol.category !== 'CEX')
    .map(({ id, name, category, chain, tvl, slug, change_1d, change_7d, logo }) => ({
      id,
      name,
      category,
      chain,
      tvl,
      slug,
      change1d: typeof change_1d === 'number' && Number.isFinite(change_1d) ? change_1d : null,
      change7d: typeof change_7d === 'number' && Number.isFinite(change_7d) ? change_7d : null,
      logo: logo ?? null,
    }));
}
