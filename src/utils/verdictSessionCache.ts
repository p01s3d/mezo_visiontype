import type { Address } from 'viem';
import type { PositionVerdict } from '../types/positionHealth';

const BATCH_PREFIX = 'health-verdict-batch';
const DISMISSED_PREFIX = 'health-verdict-dismissed';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function batchStorageKey(address: Address): string {
  return `${BATCH_PREFIX}:${address.toLowerCase()}:${todayKey()}`;
}

function dismissedStorageKey(address: Address): string {
  return `${DISMISSED_PREFIX}:${address.toLowerCase()}:${todayKey()}`;
}

export type VerdictBatchCache = {
  candidateIds: string[];
  verdicts: PositionVerdict[];
  verdictsByPositionId: Record<string, PositionVerdict>;
};

function readJson<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export function readVerdictBatch(address: Address): VerdictBatchCache | null {
  return readJson<VerdictBatchCache>(batchStorageKey(address));
}

export function writeVerdictBatch(address: Address, batch: VerdictBatchCache): void {
  writeJson(batchStorageKey(address), batch);
}

export function clearVerdictBatch(address: Address): void {
  try {
    sessionStorage.removeItem(batchStorageKey(address));
  } catch {
    // ignore
  }
}

export function readDismissedVerdictIds(address: Address): Set<string> {
  const ids = readJson<string[]>(dismissedStorageKey(address));
  return new Set(ids ?? []);
}

export function writeDismissedVerdictIds(address: Address, ids: Set<string>): void {
  writeJson(dismissedStorageKey(address), [...ids]);
}

export function dismissVerdictCard(address: Address, cardId: string): Set<string> {
  const dismissed = readDismissedVerdictIds(address);
  dismissed.add(cardId);
  writeDismissedVerdictIds(address, dismissed);
  clearVerdictBatch(address);
  return dismissed;
}

export function batchMatchesCandidates(batch: VerdictBatchCache, candidateIds: string[]): boolean {
  if (batch.candidateIds.length !== candidateIds.length) return false;
  return batch.candidateIds.every((id, index) => id === candidateIds[index]);
}
