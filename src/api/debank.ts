export type DebankToken = {
  id: string;
  chain: string;
  name: string | null;
  symbol: string | null;
  display_symbol: string | null;
  optimized_symbol: string | null;
  decimals: number | null;
  logo_url: string | null;
  price: number;
  is_core: boolean;
  is_wallet: boolean;
  amount: number;
  raw_amount: number;
};

export type WalletToken = {
  id: string;
  chain: string;
  name: string;
  symbol: string;
  amount: number;
  price: number;
  valueUsd: number;
  logoUrl: string | null;
  isCore: boolean;
};

export type DebankPortfolioItem = {
  name: string;
  detail_types: string[];
  stats: {
    asset_usd_value: number;
    debt_usd_value: number;
    net_usd_value: number;
  };
  update_at: number;
};

export type DebankProtocolPosition = {
  id: string;
  chain: string;
  name: string;
  logo_url: string | null;
  portfolio_item_list: DebankPortfolioItem[];
};

export type DebankTotalBalance = {
  total_usd_value: number;
  chain_list?: Array<{
    id: string;
    community_id: number;
    name: string;
    usd_value: number;
  }>;
};

export type PersonalPosition = {
  id: string;
  name: string;
  protocol: string;
  chain: string;
  valueUsd: number;
  debtUsd: number;
  positionType: string;
};

export type PersonalProtocolSummary = {
  id: string;
  protocol: string;
  chain: string;
  valueUsd: number;
  positionCount: number;
};

const DEBANK_BASE_URL = 'https://pro-openapi.debank.com/v1';

function getAccessKey(): string | undefined {
  return import.meta.env.VITE_DEBANK_ACCESS_KEY;
}

async function debankFetch<T>(path: string): Promise<T> {
  const accessKey = getAccessKey();
  if (!accessKey) {
    throw new Error('MISSING_API_KEY');
  }

  const response = await fetch(`${DEBANK_BASE_URL}${path}`, {
    headers: {
      accept: 'application/json',
      AccessKey: accessKey,
    },
  });

  if (!response.ok) {
    throw new Error(`DeBank request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export function hasDebankAccessKey(): boolean {
  return Boolean(getAccessKey());
}

export async function fetchWalletProtocolPositions(
  address: string,
): Promise<DebankProtocolPosition[]> {
  return debankFetch<DebankProtocolPosition[]>(
    `/user/all_complex_protocol_list?id=${address}`,
  );
}

export async function fetchWalletTotalBalance(address: string): Promise<DebankTotalBalance> {
  return debankFetch<DebankTotalBalance>(`/user/total_balance?id=${address}`);
}

export async function fetchWalletTokens(address: string): Promise<DebankToken[]> {
  return debankFetch<DebankToken[]>(
    `/user/all_token_list?id=${address}&is_all=false`,
  );
}

export function normalizeWalletTokens(tokens: DebankToken[]): WalletToken[] {
  return tokens
    .filter((token) => token.amount > 0)
    .map((token) => ({
      id: `${token.chain}-${token.id}`,
      chain: token.chain,
      name: token.name ?? token.symbol ?? 'Unknown',
      symbol: token.optimized_symbol ?? token.display_symbol ?? token.symbol ?? '???',
      amount: token.amount,
      price: token.price,
      valueUsd: token.amount * token.price,
      logoUrl: token.logo_url,
      isCore: token.is_core,
    }))
    .filter((token) => token.isCore || token.valueUsd >= 0.01)
    .sort((a, b) => b.valueUsd - a.valueUsd);
}

export function flattenProtocolPositions(
  protocols: DebankProtocolPosition[],
): PersonalPosition[] {
  const positions: PersonalPosition[] = [];

  for (const protocol of protocols) {
    for (const item of protocol.portfolio_item_list) {
      if (item.stats.net_usd_value <= 0) continue;

      positions.push({
        id: `${protocol.id}-${item.name}-${item.update_at}`,
        name: item.name,
        protocol: protocol.name,
        chain: protocol.chain,
        valueUsd: item.stats.net_usd_value,
        debtUsd: item.stats.debt_usd_value,
        positionType: item.detail_types.join(', ') || 'position',
      });
    }
  }

  return positions.sort((a, b) => b.valueUsd - a.valueUsd);
}

export function summarizeByProtocol(
  positions: PersonalPosition[],
): PersonalProtocolSummary[] {
  const grouped = new Map<string, PersonalProtocolSummary>();

  for (const position of positions) {
    const key = `${position.chain}-${position.protocol}`;
    const existing = grouped.get(key);

    if (existing) {
      existing.valueUsd += position.valueUsd;
      existing.positionCount += 1;
      continue;
    }

    grouped.set(key, {
      id: key,
      protocol: position.protocol,
      chain: position.chain,
      valueUsd: position.valueUsd,
      positionCount: 1,
    });
  }

  return [...grouped.values()].sort((a, b) => b.valueUsd - a.valueUsd);
}
