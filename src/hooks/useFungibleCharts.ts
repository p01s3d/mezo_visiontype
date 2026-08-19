import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchFungibleChart, type ChartSeries } from '../api/zerion';
import {
  clearFungibleDayChartsCache,
  fungibleDayChartsCachePrefix,
  isCacheFresh,
  readJsonCache,
  writeJsonCache,
} from '../utils/walletDataCache';

type ChartMap = Record<string, ChartSeries>;

type ChartsCache = {
  charts: ChartMap;
  fetchedAt: number;
};

const memoryCache = new Map<string, ChartsCache>();

function storageKey(idKey: string): string {
  return `${fungibleDayChartsCachePrefix()}${idKey}`;
}

function readCache(idKey: string): ChartsCache | null {
  const mem = memoryCache.get(idKey);
  if (mem) return mem;
  const stored = readJsonCache<ChartsCache>(storageKey(idKey));
  if (stored?.fetchedAt && stored.charts) {
    memoryCache.set(idKey, stored);
    return stored;
  }
  return null;
}

function writeCache(idKey: string, value: ChartsCache): void {
  memoryCache.set(idKey, value);
  writeJsonCache(storageKey(idKey), value);
}

/** Clear Prices sparklines cache (header Refresh). */
export function clearFungibleChartsMemory(): void {
  memoryCache.clear();
  clearFungibleDayChartsCache();
}

/**
 * Day charts for fungible IDs (Prices sparklines).
 * Cached 24h — Refresh is the only invalidate.
 */
export function useFungibleCharts(
  fungibleIds: string[],
  enabled: boolean,
  refreshEpoch = 0,
): {
  chartsByFungibleId: ChartMap;
  loading: boolean;
} {
  const key = useMemo(
    () => [...new Set(fungibleIds.filter(Boolean))].sort().join(','),
    [fungibleIds],
  );
  const idKey = useMemo(() => key.split(',').filter(Boolean).slice(0, 5).join(','), [key]);

  const [chartsByFungibleId, setCharts] = useState<ChartMap>(() => {
    if (!idKey) return {};
    return readCache(idKey)?.charts ?? {};
  });
  const [loading, setLoading] = useState(false);
  const lastRefreshEpoch = useRef(refreshEpoch);

  useEffect(() => {
    if (!enabled || !idKey) {
      setCharts({});
      setLoading(false);
      return;
    }

    const cached = readCache(idKey);
    const forced = refreshEpoch !== lastRefreshEpoch.current;
    lastRefreshEpoch.current = refreshEpoch;

    if (cached) {
      setCharts(cached.charts);
      if (isCacheFresh(cached.fetchedAt) && !forced) {
        setLoading(false);
        return;
      }
    }

    const ids = idKey.split(',').filter(Boolean);
    let cancelled = false;
    setLoading(!cached);

    void (async () => {
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            const series = await fetchFungibleChart(id, 'day');
            return [id, series] as const;
          } catch {
            return null;
          }
        }),
      );

      if (cancelled) return;

      const next: ChartMap = {};
      for (const entry of entries) {
        if (entry && entry[1].values.length >= 2) {
          next[entry[0]] = entry[1];
        }
      }

      // Prefer new data; if all failed keep cache.
      const charts = Object.keys(next).length > 0 ? next : (cached?.charts ?? {});
      if (Object.keys(next).length > 0) {
        writeCache(idKey, { charts: next, fetchedAt: Date.now() });
      }
      setCharts(charts);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, idKey, refreshEpoch]);

  return { chartsByFungibleId, loading };
}
