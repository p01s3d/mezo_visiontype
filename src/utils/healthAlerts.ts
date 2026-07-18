import type { HealthFactor, PortfolioHealthScore } from './portfolioHealthScore';
import type { SignalSeverity } from '../types/positionHealth';

export type AppAlertCategory = 'price' | 'custom' | 'activity';

export type AppAlert = {
  id: string;
  severity: SignalSeverity;
  category: AppAlertCategory;
  title: string;
  body: string;
  createdAt: string;
  seen: boolean;
  sourceFactorId?: string;
};

const MAX_UNREAD = 3;

function dayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function inboxKey(address: string): string {
  return `health-alerts:${address.toLowerCase()}:${dayKey()}`;
}

function scoreKey(address: string): string {
  return `health-score-cache:${address.toLowerCase()}:${dayKey()}`;
}

function toastedKey(address: string): string {
  return `health-alert-toasted:${address.toLowerCase()}:${dayKey()}`;
}

export function readAlerts(address: string): AppAlert[] {
  try {
    const raw = sessionStorage.getItem(inboxKey(address));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Partial<AppAlert> & AppAlert>;
    return parsed.map((alert) => ({
      ...alert,
      category: alert.category ?? alertCategoryFromFactorId(alert.sourceFactorId),
    })) as AppAlert[];
  } catch {
    return [];
  }
}

export function writeAlerts(address: string, alerts: AppAlert[]): void {
  try {
    sessionStorage.setItem(inboxKey(address), JSON.stringify(alerts.slice(0, 12)));
  } catch {
    // ignore
  }
}

export function readCachedScore(address: string): number | null {
  try {
    const raw = sessionStorage.getItem(scoreKey(address));
    if (!raw) return null;
    return Number(raw);
  } catch {
    return null;
  }
}

export function writeCachedScore(address: string, score: number): void {
  try {
    sessionStorage.setItem(scoreKey(address), String(score));
  } catch {
    // ignore
  }
}

export function wasToasted(address: string, alertId: string): boolean {
  try {
    const raw = sessionStorage.getItem(toastedKey(address));
    if (!raw) return false;
    const ids = JSON.parse(raw) as string[];
    return ids.includes(alertId);
  } catch {
    return false;
  }
}

export function markToasted(address: string, alertId: string): void {
  try {
    const raw = sessionStorage.getItem(toastedKey(address));
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    if (!ids.includes(alertId)) ids.push(alertId);
    sessionStorage.setItem(toastedKey(address), JSON.stringify(ids));
  } catch {
    // ignore
  }
}

function experimentalTitle(factor: HealthFactor): string {
  if (factor.id === 'vs_btc_lag' || factor.id.startsWith('vs_btc')) {
    return 'BTC would have cooked you';
  }
  if (factor.id === 'drawdown') return 'Net worth took a dive';
  if (factor.id.includes('apy_collapse')) return 'Yield just got wrecked';
  if (factor.id === 'concentration' || factor.id.startsWith('concentration')) {
    return 'One bag is doing too much';
  }
  return factor.label;
}

function alertCategoryFromFactorId(factorId: string | undefined): AppAlertCategory {
  if (!factorId) return 'custom';
  if (
    factorId === 'vs_btc_lag' ||
    factorId.startsWith('vs_btc') ||
    factorId === 'drawdown' ||
    factorId.includes('apy_collapse')
  ) {
    return 'price';
  }
  return 'custom';
}

export function buildAlertsFromHealth(
  health: PortfolioHealthScore,
  previousScore: number | null,
): AppAlert[] {
  const now = new Date().toISOString();
  const alerts: AppAlert[] = [];

  if (previousScore !== null && health.score <= previousScore - 12) {
    alerts.push({
      id: `score-drop:${dayKey()}`,
      severity: health.score < 45 ? 'high' : 'medium',
      category: 'custom',
      title: 'Health score slid',
      body: `Dropped from ${previousScore} → ${health.score}. ${health.ruleNarrative}`,
      createdAt: now,
      seen: false,
      sourceFactorId: 'score_drop',
    });
  }

  for (const factor of health.factors) {
    if (factor.severity === 'low' && factor.id === 'vs_btc_lead') continue;
    if (factor.severity === 'low') continue;

    alerts.push({
      id: `${factor.id}:${dayKey()}`,
      severity: factor.severity,
      category: alertCategoryFromFactorId(factor.id),
      title: experimentalTitle(factor),
      body: factor.why,
      createdAt: now,
      seen: false,
      sourceFactorId: factor.id,
    });
  }

  // Prefer high severity, cap
  alerts.sort((a, b) => {
    const rank = (s: SignalSeverity) => (s === 'high' ? 0 : s === 'medium' ? 1 : 2);
    return rank(a.severity) - rank(b.severity);
  });

  return alerts.slice(0, MAX_UNREAD + 2);
}

export function mergeAlerts(existing: AppAlert[], incoming: AppAlert[]): AppAlert[] {
  const byId = new Map(existing.map((a) => [a.id, a]));
  for (const alert of incoming) {
    const prev = byId.get(alert.id);
    if (prev) {
      byId.set(alert.id, { ...alert, seen: prev.seen });
    } else {
      byId.set(alert.id, alert);
    }
  }
  const merged = [...byId.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return merged.slice(0, 12);
}

export function unreadCount(alerts: AppAlert[]): number {
  return Math.min(
    MAX_UNREAD,
    alerts.filter((a) => !a.seen).length,
  );
}

export function markAlertSeen(alerts: AppAlert[], alertId: string): AppAlert[] {
  return alerts.map((a) => (a.id === alertId ? { ...a, seen: true } : a));
}

export function markAllSeen(alerts: AppAlert[]): AppAlert[] {
  return alerts.map((a) => ({ ...a, seen: true }));
}

export function firstHighUnseenForToast(alerts: AppAlert[], address: string): AppAlert | null {
  const high = alerts.find((a) => !a.seen && a.severity === 'high' && !wasToasted(address, a.id));
  return high ?? null;
}
