import type { PersonalPosition, WalletToken } from './walletTypes';

const ZERION_BASE_URL = '/api/zerion/v1';
const PAGE_SIZE = 100;
const MAX_PAGES = 1;
const RETRY_DELAYS_MS = [1000, 2000];

type ZerionLinks = {
  self: string;
  next?: string;
};

type ZerionPositionAttributes = {
  name: string;
  protocol?: string | null;
  protocol_module?: string | null;
  position_type?: string | null;
  price?: number | null;
  value?: number | null;
  quantity?: {
    float: number;
  };
  fungible_info?: {
    name: string;
    symbol: string;
    icon?: {
      url?: string | null;
    } | null;
  };
};

type ZerionPosition = {
  type: string;
  id: string;
  attributes: ZerionPositionAttributes;
  relationships?: {
    chain?: {
      data?: {
        id: string;
      };
    };
  };
};

type ZerionPositionsResponse = {
  links: ZerionLinks;
  data: ZerionPosition[];
};

type ZerionPortfolioResponse = {
  data: {
    attributes: {
      total?: {
        positions?: number;
      };
    };
  };
};

const inFlightRequests = new Map<string, Promise<unknown>>();

export function getZerionApiKeyIssue(): 'missing' | 'empty' | null {
  const rawKey = import.meta.env.VITE_ZERION_API_KEY;
  if (rawKey === undefined) return 'missing';
  if (!rawKey.trim()) return 'empty';
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function zerionFetch<T>(path: string, attempt = 0): Promise<T> {
  const response = await fetch(`${ZERION_BASE_URL}${path}`, {
    headers: {
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 429 && attempt < RETRY_DELAYS_MS.length) {
      await sleep(RETRY_DELAYS_MS[attempt]);
      return zerionFetch<T>(path, attempt + 1);
    }

    let detail = `Zerion request failed (${response.status})`;
    try {
      const body = (await response.json()) as {
        errors?: Array<{ detail?: string; title?: string }>;
      };
      const firstError = body.errors?.[0];
      if (firstError?.detail) detail = firstError.detail;
      else if (firstError?.title) detail = firstError.title;
    } catch {
      // Keep generic message when error body is not JSON.
    }

    if (response.status === 401) {
      throw new Error('Invalid Zerion API key. Check VITE_ZERION_API_KEY in `.env`.');
    }
    if (response.status === 429) {
      throw new Error(
        'Zerion rate limit reached. Wait a minute, avoid switching tabs quickly, or upgrade your plan at dashboard.zerion.io.',
      );
    }

    throw new Error(detail);
  }

  return response.json() as Promise<T>;
}

function dedupeRequest<T>(key: string, request: () => Promise<T>): Promise<T> {
  const existing = inFlightRequests.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = request().finally(() => {
    inFlightRequests.delete(key);
  });
  inFlightRequests.set(key, promise);
  return promise;
}

async function fetchPositionsPage(
  address: string,
  positionsFilter: 'only_simple' | 'only_complex',
): Promise<ZerionPosition[]> {
  const params = new URLSearchParams({
    currency: 'usd',
    'filter[positions]': positionsFilter,
    'filter[trash]': 'only_non_trash',
    sort: '-value',
    'page[size]': String(PAGE_SIZE),
  });

  let url: string | null = `/wallets/${address}/positions/?${params.toString()}`;
  const allPositions: ZerionPosition[] = [];
  let pagesFetched = 0;

  while (url && pagesFetched < MAX_PAGES) {
    const response: ZerionPositionsResponse = await zerionFetch<ZerionPositionsResponse>(url);
    allPositions.push(...response.data);
    pagesFetched += 1;
    url = response.links.next ? response.links.next.replace('https://api.zerion.io/v1', '') : null;
  }

  return allPositions;
}

export function fetchWalletPortfolio(address: string): Promise<number> {
  return dedupeRequest(`portfolio:${address}`, async () => {
    const params = new URLSearchParams({
      currency: 'usd',
      'filter[positions]': 'no_filter',
    });
    const response = await zerionFetch<ZerionPortfolioResponse>(
      `/wallets/${address}/portfolio?${params.toString()}`,
    );

    return response.data.attributes.total?.positions ?? 0;
  });
}

export function fetchWalletProtocolPositions(address: string): Promise<PersonalPosition[]> {
  return dedupeRequest(`positions:${address}`, async () => {
    const positions = await fetchPositionsPage(address, 'only_complex');

    return positions
      .map((position) => mapDefiPosition(position))
      .filter((position) => position.valueUsd > 0)
      .sort((a, b) => b.valueUsd - a.valueUsd);
  });
}

export function fetchWalletTokens(address: string): Promise<WalletToken[]> {
  return dedupeRequest(`tokens:${address}`, async () => {
    const positions = await fetchPositionsPage(address, 'only_simple');

    return positions
      .map((position) => mapWalletToken(position))
      .filter((token) => token.amount > 0 && (token.isCore || token.valueUsd >= 0.01))
      .sort((a, b) => b.valueUsd - a.valueUsd);
  });
}

function mapDefiPosition(position: ZerionPosition): PersonalPosition {
  const { attributes, relationships } = position;

  return {
    id: position.id,
    name: attributes.name,
    protocol: attributes.protocol ?? 'Unknown',
    chain: relationships?.chain?.data?.id ?? 'unknown',
    valueUsd: attributes.value ?? 0,
    debtUsd: 0,
    positionType: attributes.protocol_module ?? attributes.position_type ?? 'position',
  };
}

function mapWalletToken(position: ZerionPosition): WalletToken {
  const { attributes, relationships } = position;
  const fungible = attributes.fungible_info;

  return {
    id: position.id,
    chain: relationships?.chain?.data?.id ?? 'unknown',
    name: fungible?.name ?? attributes.name,
    symbol: fungible?.symbol ?? attributes.name,
    amount: attributes.quantity?.float ?? 0,
    price: attributes.price ?? 0,
    valueUsd: attributes.value ?? 0,
    logoUrl: fungible?.icon?.url ?? null,
    isCore: true,
  };
}

export function summarizeByProtocol(positions: PersonalPosition[]) {
  const grouped = new Map<
    string,
    { id: string; protocol: string; chain: string; valueUsd: number; positionCount: number }
  >();

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
