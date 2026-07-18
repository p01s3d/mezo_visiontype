/** Persist wallet JSON across reloads; memory cache still used within a session. */

const STORAGE_PREFIX = 'defi-wallet-cache:v1:';

/**
 * Prefer network only after this window (or explicit Refresh).
 * Snapshot-first: one hydrate per day, not a live ticker.
 */
export const WALLET_CACHE_FRESH_MS = 24 * 60 * 60 * 1000;

/** Drop persisted blobs older than this so reconnect never shows ancient balances. */
export const WALLET_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function isCacheFresh(timestamp: number | null, ttlMs = WALLET_CACHE_FRESH_MS): boolean {
  return timestamp !== null && Date.now() - timestamp < ttlMs;
}

export function isCacheUsable(timestamp: number | null, maxAgeMs = WALLET_CACHE_MAX_AGE_MS): boolean {
  return timestamp !== null && Date.now() - timestamp < maxAgeMs;
}

export function readJsonCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJsonCache(key: string, value: unknown): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // Quota / private mode — memory cache still works for the session.
  }
}

/** Remove all localStorage entries whose key starts with STORAGE_PREFIX + prefix. */
export function clearJsonCacheByPrefix(prefix: string): void {
  try {
    const full = STORAGE_PREFIX + prefix;
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith(full)) toRemove.push(key);
    }
    for (const key of toRemove) localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function walletPositionsCacheKey(address: string): string {
  return `positions:${address.toLowerCase()}`;
}

export function walletLpTxCacheKey(address: string): string {
  return `lp-txs:${address.toLowerCase()}`;
}

export function walletChartCacheKey(address: string, period: string): string {
  return `chart:${address.toLowerCase()}:${period}`;
}

export function walletInsightsCacheKey(address: string): string {
  return `insights:${address.toLowerCase()}`;
}

export function sleeveReturnsCachePrefix(): string {
  return 'sleeve-returns:';
}

export function fungibleDayChartsCachePrefix(): string {
  return 'fungible-day-charts:';
}

const CHART_PERIODS = ['hour', 'day', 'week', 'month', 'year', 'max'] as const;

/** Drop persisted chart entries for an address (force refresh). */
export function clearWalletChartCache(address: string): void {
  const addr = address.toLowerCase();
  for (const period of CHART_PERIODS) {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${walletChartCacheKey(addr, period)}`);
    } catch {
      // ignore
    }
  }
}

export function clearWalletInsightsCache(address: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${walletInsightsCacheKey(address)}`);
  } catch {
    // ignore
  }
}

export function clearWalletSleeveCache(): void {
  clearJsonCacheByPrefix(sleeveReturnsCachePrefix());
}

export function clearFungibleDayChartsCache(): void {
  clearJsonCacheByPrefix(fungibleDayChartsCachePrefix());
}
