/** Persist wallet JSON across reloads; memory cache still used within a session. */

/** Bump when intentionally invalidating all clients (demo/live isolation reset). */
const STORAGE_PREFIX = 'defi-wallet-cache:v2:';

const ALL_CACHE_PREFIXES = ['defi-wallet-cache:v1:', 'defi-wallet-cache:v2:'] as const;

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

function removeStorageKey(key: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch {
    // ignore
  }
}

/** Drop persisted chart entries for an address (force refresh). */
export function clearWalletChartCache(address: string): void {
  const addr = address.toLowerCase();
  for (const period of CHART_PERIODS) {
    removeStorageKey(walletChartCacheKey(addr, period));
  }
}

/** Drop persisted positions book for an address (force refresh). */
export function clearWalletPositionsCache(address: string): void {
  removeStorageKey(walletPositionsCacheKey(address));
}

/** Drop persisted LP transactions for an address (force refresh). */
export function clearWalletLpTxCache(address: string): void {
  removeStorageKey(walletLpTxCacheKey(address));
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

const CHART_ALIGN_MIGRATION_FLAG = `${STORAGE_PREFIX}migrated:chart-align-v2`;

type LegacyChartCacheBlob = {
  state?: {
    rawPortfolioValues?: unknown;
    rawTimestamps?: unknown;
    timestamps?: unknown;
    portfolioValues?: unknown;
  };
};

function isAlignedChartState(state: LegacyChartCacheBlob['state']): boolean {
  if (!state) return false;
  const raw = state.rawPortfolioValues;
  const portfolio = state.portfolioValues;
  const rawTs = state.rawTimestamps;
  const overlayTs = state.timestamps;
  // v2 requires rawTimestamps matching raw USD; overlay timestamps may differ in length.
  if (
    Array.isArray(raw) &&
    Array.isArray(portfolio) &&
    Array.isArray(rawTs) &&
    raw.length >= 2 &&
    portfolio.length >= 2 &&
    rawTs.length === raw.length
  ) {
    return true;
  }
  // Legacy without overlay remap: single timestamps array matched raw.
  return (
    Array.isArray(raw) &&
    Array.isArray(overlayTs) &&
    Array.isArray(portfolio) &&
    raw.length >= 2 &&
    overlayTs.length >= 2 &&
    portfolio.length >= 2 &&
    overlayTs.length === raw.length
  );
}

/**
 * One-time purge of chart cache entries missing usable timestamps.
 * Safe to call on every boot — gated by a localStorage flag.
 */
export function migrateChartCacheAlignment(): void {
  try {
    if (localStorage.getItem(CHART_ALIGN_MIGRATION_FLAG) === '1') return;

    const chartPrefix = `${STORAGE_PREFIX}chart:`;
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key?.startsWith(chartPrefix)) continue;
      try {
        const parsed = JSON.parse(localStorage.getItem(key) ?? '') as LegacyChartCacheBlob;
        if (!isAlignedChartState(parsed.state)) toRemove.push(key);
      } catch {
        toRemove.push(key);
      }
    }
    for (const key of toRemove) localStorage.removeItem(key);
    localStorage.setItem(CHART_ALIGN_MIGRATION_FLAG, '1');
  } catch {
    // Private mode / blocked storage — skip; runtime hydratable checks still apply.
  }
}

const FULL_PURGE_FLAG = 'defi-wallet-cache:purged:isolation-reset-v2';

/** Remove every defi-wallet-cache key (all versions). Call on boot after a reset. */
export function purgeAllWalletLocalStorage(): void {
  try {
    if (localStorage.getItem(FULL_PURGE_FLAG) === '1') return;

    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (ALL_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix)) || key.startsWith('defi-wallet-cache:')) {
        toRemove.push(key);
      }
    }
    for (const key of toRemove) localStorage.removeItem(key);
    localStorage.setItem(FULL_PURGE_FLAG, '1');
  } catch {
    // ignore
  }
}
