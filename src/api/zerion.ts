import type { LpOperationType, LpTransaction, PersonalPosition, PoolPositionLeg, WalletToken } from './walletTypes';
import type { FungiblePnlStats } from '../utils/poolPnl';

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
  group_id?: string | null;
  price?: number | null;
  value?: number | null;
  quantity?: {
    float: number;
  };
  changes?: {
    absolute_1d?: number | null;
    percent_1d?: number | null;
  } | null;
  fungible_info?: {
    name: string;
    symbol: string;
    icon?: {
      url?: string | null;
    } | null;
  };
  application_metadata?: {
    name?: string | null;
    icon?: {
      url?: string | null;
    } | null;
  } | null;
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
    fungible?: {
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

type ZerionTransactionTransfer = {
  direction: 'in' | 'out' | 'self';
  value?: number | null;
  quantity?: {
    float: number;
  };
  fungible_info?: {
    symbol?: string;
    name?: string;
    icon?: {
      url?: string | null;
    } | null;
  } | null;
};

type ZerionTransactionAttributes = {
  operation_type: string;
  mined_at: string;
  transfers: ZerionTransactionTransfer[];
  application_metadata?: {
    name?: string | null;
    icon?: {
      url?: string | null;
    } | null;
  } | null;
};

type ZerionTransaction = {
  type: string;
  id: string;
  attributes: ZerionTransactionAttributes;
  relationships?: {
    chain?: {
      data?: {
        id: string;
      };
    };
  };
};

type ZerionTransactionsResponse = {
  links: ZerionLinks;
  data: ZerionTransaction[];
};

type ZerionPnlStatistics = {
  unrealized_gain?: number | null;
  net_invested?: number | null;
  relative_unrealized_gain_percentage?: number | null;
};

type ZerionPnlResponse = {
  data: {
    attributes: {
      breakdown?: {
        by_id?: Record<string, ZerionPnlStatistics>;
      };
    };
  };
};

export type ChartPeriod =
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | '3months'
  | '6months'
  | 'year'
  | 'max';

export type ChartSeries = {
  values: number[];
  timestamps: number[];
  changePct: number;
};

type ZerionChartResponse = {
  data: {
    attributes: {
      begin_at: string;
      end_at: string;
      points: Array<[number, number]>;
    };
  };
};

function mapChartPoints(points: Array<[number, number]>): ChartSeries {
  const pairs = (points ?? [])
    .filter(
      (p): p is [number, number] =>
        Array.isArray(p) &&
        p.length >= 2 &&
        Number.isFinite(p[0]) &&
        Number.isFinite(p[1]),
    )
    .map(([ts, value]) => {
      // Zerion may return ms; keep seconds for chart math / axis labels.
      const unix = ts > 1e12 ? ts / 1000 : ts;
      return [unix, value] as [number, number];
    })
    .sort((a, b) => a[0] - b[0]);

  const timestamps = pairs.map(([ts]) => ts);
  const values = pairs.map(([, value]) => value);
  const changePct =
    values.length >= 2 && values[0] !== 0
      ? ((values[values.length - 1] - values[0]) / values[0]) * 100
      : 0;
  return { values, timestamps, changePct };
}

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

export function fetchWalletBalanceChart(
  address: string,
  period: ChartPeriod = '3months',
): Promise<ChartSeries> {
  return dedupeRequest(`wallet-chart:${address}:${period}`, async () => {
    const params = new URLSearchParams({ currency: 'usd' });
    const response = await zerionFetch<ZerionChartResponse>(
      `/wallets/${address}/charts/${period}?${params.toString()}`,
    );
    return mapChartPoints(response.data.attributes.points ?? []);
  });
}

export function fetchFungibleChart(
  fungibleId: string,
  period: ChartPeriod = 'day',
): Promise<ChartSeries> {
  return dedupeRequest(`fungible-chart:${fungibleId}:${period}`, async () => {
    const params = new URLSearchParams({ currency: 'usd' });
    const response = await zerionFetch<ZerionChartResponse>(
      `/fungibles/${encodeURIComponent(fungibleId)}/charts/${period}?${params.toString()}`,
    );
    return mapChartPoints(response.data.attributes.points ?? []);
  });
}

export type FungiblePeriodChanges = {
  percent30d: number | null;
  percent365d: number | null;
};

type ZerionFungiblesListResponse = {
  data: Array<{
    id: string;
    attributes?: {
      market_data?: {
        changes?: {
          percent_30d?: number | null;
          percent_365d?: number | null;
        } | null;
      } | null;
    };
  }>;
};

/** Batch market % changes (30d / 365d) for sleeve performance — one list request. */
export function fetchFungiblePeriodChanges(
  fungibleIds: string[],
): Promise<Record<string, FungiblePeriodChanges>> {
  const uniqueIds = [...new Set(fungibleIds.filter(Boolean))];
  if (uniqueIds.length === 0) return Promise.resolve({});

  const cacheKey = `fungible-changes:${uniqueIds.slice().sort().join(',')}`;
  return dedupeRequest(cacheKey, async () => {
    const params = new URLSearchParams({
      currency: 'usd',
      'filter[fungible_ids]': uniqueIds.join(','),
    });
    const response = await zerionFetch<ZerionFungiblesListResponse>(
      `/fungibles/?${params.toString()}`,
    );

    const mapped: Record<string, FungiblePeriodChanges> = {};
    for (const item of response.data ?? []) {
      const changes = item.attributes?.market_data?.changes;
      mapped[item.id] = {
        percent30d:
          changes?.percent_30d != null && Number.isFinite(changes.percent_30d)
            ? changes.percent_30d
            : null,
        percent365d:
          changes?.percent_365d != null && Number.isFinite(changes.percent_365d)
            ? changes.percent_365d
            : null,
      };
    }
    return mapped;
  });
}

/** BTC price history — env fungible id, else native bitcoin, else WBTC proxy. */
export function fetchBtcBenchmarkChart(period: ChartPeriod = 'month'): Promise<ChartSeries> {
  const envId = import.meta.env.VITE_ZERION_BTC_FUNGIBLE_ID?.trim();
  if (envId) {
    return fetchFungibleChart(envId, period);
  }

  return dedupeRequest(`btc-chart:${period}`, async () => {
    const byImplementation = async (implementation: string) => {
      const params = new URLSearchParams({ currency: 'usd', implementation });
      const response = await zerionFetch<ZerionChartResponse>(
        `/fungibles/by-implementation/charts/${period}?${params.toString()}`,
      );
      return mapChartPoints(response.data.attributes.points ?? []);
    };

    // `implementation` (not filter[implementation]) — Zerion required query param.
    try {
      const native = await byImplementation('bitcoin');
      if (native.values.length >= 2) return native;
    } catch {
      // fall through to WBTC
    }
    return byImplementation('ethereum:0x2260fac5e5542a773aa44fbcfedf7c193bc2c599');
  });
}

export function fetchWalletProtocolPositions(address: string): Promise<PersonalPosition[]> {
  return dedupeRequest(`positions:${address}`, async () => {
    const positions = await fetchPositionsPage(address, 'only_complex');
    return mapComplexPositions(positions);
  });
}

export function fetchWalletPoolLegs(address: string): Promise<PoolPositionLeg[]> {
  return dedupeRequest(`pool-legs:${address}`, async () => {
    const positions = await fetchPositionsPage(address, 'only_complex');
    return mapPoolLegs(positions);
  });
}

export function fetchWalletComplexPositions(address: string): Promise<{
  personalPositions: PersonalPosition[];
  poolLegs: PoolPositionLeg[];
}> {
  return dedupeRequest(`complex:${address}`, async () => {
    const positions = await fetchPositionsPage(address, 'only_complex');
    return {
      personalPositions: mapComplexPositions(positions),
      poolLegs: mapPoolLegs(positions),
    };
  });
}

const MAX_PNL_FUNGIBLE_IDS = 100;

export function fetchWalletFungiblePnl(
  address: string,
  fungibleIds: string[],
): Promise<Record<string, FungiblePnlStats>> {
  if (fungibleIds.length === 0) {
    return Promise.resolve({});
  }

  const uniqueIds = [...new Set(fungibleIds)].slice(0, MAX_PNL_FUNGIBLE_IDS);
  const cacheKey = `pnl:${address}:${uniqueIds.join(',')}`;

  return dedupeRequest(cacheKey, async () => {
    const params = new URLSearchParams({
      currency: 'usd',
      'filter[fungible_ids]': uniqueIds.join(','),
    });

    const response = await zerionFetch<ZerionPnlResponse>(
      `/wallets/${address}/pnl?${params.toString()}`,
    );

    const byId = response.data.attributes.breakdown?.by_id ?? {};
    const mapped: Record<string, FungiblePnlStats> = {};

    for (const [fungibleId, stats] of Object.entries(byId)) {
      mapped[fungibleId] = {
        unrealizedGainUsd: stats.unrealized_gain ?? 0,
        netInvestedUsd: stats.net_invested ?? null,
        relativeUnrealizedGainPercent: stats.relative_unrealized_gain_percentage ?? null,
      };
    }

    return mapped;
  });
}

const LP_OPERATION_TYPES = ['deposit', 'withdraw', 'claim'] as const;

export function fetchWalletLpTransactions(address: string): Promise<LpTransaction[]> {
  return dedupeRequest(`lp-transactions:${address}`, async () => {
    const params = new URLSearchParams({
      currency: 'usd',
      'filter[operation_types]': LP_OPERATION_TYPES.join(','),
      'page[size]': String(PAGE_SIZE),
    });

    let url: string | null = `/wallets/${address}/transactions/?${params.toString()}`;
    const allTransactions: ZerionTransaction[] = [];
    let pagesFetched = 0;

    while (url && pagesFetched < MAX_PAGES) {
      const response: ZerionTransactionsResponse = await zerionFetch<ZerionTransactionsResponse>(url);
      allTransactions.push(...response.data);
      pagesFetched += 1;
      url = response.links.next ? response.links.next.replace('https://api.zerion.io/v1', '') : null;
    }

    return allTransactions
      .map((transaction) => mapLpTransaction(transaction))
      .filter((transaction): transaction is LpTransaction => transaction !== null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

function mapComplexPositions(positions: ZerionPosition[]): PersonalPosition[] {
  return positions
    .map((position) => mapDefiPosition(position))
    .filter((position) => position.valueUsd > 0)
    .sort((a, b) => b.valueUsd - a.valueUsd);
}

function mapPoolLegs(positions: ZerionPosition[]): PoolPositionLeg[] {
  return positions
    .map((position) => mapPoolPositionLeg(position))
    .filter((leg) => leg.valueUsd > 0)
    .sort((a, b) => b.valueUsd - a.valueUsd);
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

function mapPoolPositionLeg(position: ZerionPosition): PoolPositionLeg {
  const { attributes, relationships } = position;
  const fungible = attributes.fungible_info;
  const appMeta = attributes.application_metadata;

  return {
    id: position.id,
    groupId: attributes.group_id ?? null,
    fungibleId: relationships?.fungible?.data?.id ?? null,
    name: attributes.name,
    symbol: fungible?.symbol ?? null,
    protocol: attributes.protocol ?? appMeta?.name ?? 'Unknown',
    protocolModule: attributes.protocol_module ?? attributes.position_type ?? 'position',
    protocolIconUrl: appMeta?.icon?.url ?? fungible?.icon?.url ?? null,
    chain: relationships?.chain?.data?.id ?? 'unknown',
    valueUsd: attributes.value ?? 0,
    change24hUsd: attributes.changes?.absolute_1d ?? null,
    change24hPercent: attributes.changes?.percent_1d ?? null,
    unrealizedPnlUsd: null,
    positionType: attributes.position_type ?? attributes.protocol_module ?? 'position',
  };
}

const LP_OPERATION_LABELS: Record<LpOperationType, string> = {
  deposit: 'Added liquidity',
  withdraw: 'Removed liquidity',
  claim: 'Claimed fees',
};

function mapLpTransaction(transaction: ZerionTransaction): LpTransaction | null {
  const { attributes, relationships } = transaction;
  const operationType = attributes.operation_type as LpOperationType;

  if (!LP_OPERATION_TYPES.includes(operationType)) {
    return null;
  }

  const protocol = attributes.application_metadata?.name ?? 'DeFi';
  const outwardTransfers = attributes.transfers.filter((transfer) => transfer.direction === 'out');
  const inwardTransfers = attributes.transfers.filter((transfer) => transfer.direction === 'in');
  const relevantTransfers = operationType === 'withdraw' || operationType === 'claim' ? inwardTransfers : outwardTransfers;
  const fallbackTransfers = relevantTransfers.length > 0 ? relevantTransfers : attributes.transfers;

  const amountUsd = fallbackTransfers.reduce((sum, transfer) => sum + Math.abs(transfer.value ?? 0), 0);
  const poolLabel =
    fallbackTransfers
      .map((transfer) => transfer.fungible_info?.symbol ?? transfer.fungible_info?.name)
      .filter((label): label is string => Boolean(label))
      .join(' / ') || protocol;

  const direction: LpTransaction['direction'] =
    operationType === 'withdraw' || operationType === 'claim' ? 'in' : 'out';

  return {
    id: transaction.id,
    title: LP_OPERATION_LABELS[operationType],
    protocol,
    poolLabel,
    operationType,
    amountUsd: amountUsd > 0 ? amountUsd : 0,
    date: attributes.mined_at,
    direction,
    chain: relationships?.chain?.data?.id ?? 'unknown',
  };
}

function mapWalletToken(position: ZerionPosition): WalletToken {
  const { attributes, relationships } = position;
  const fungible = attributes.fungible_info;

  return {
    id: position.id,
    fungibleId: relationships?.fungible?.data?.id ?? null,
    chain: relationships?.chain?.data?.id ?? 'unknown',
    name: fungible?.name ?? attributes.name,
    symbol: fungible?.symbol ?? attributes.name,
    amount: attributes.quantity?.float ?? 0,
    price: attributes.price ?? 0,
    valueUsd: attributes.value ?? 0,
    logoUrl: fungible?.icon?.url ?? null,
    isCore: true,
    change24hPercent: attributes.changes?.percent_1d ?? null,
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
