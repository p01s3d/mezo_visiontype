import type { GroupedPoolPosition, LpTransaction } from '../api/walletTypes';
import type { PositionVerdict } from '../types/positionHealth';

export function findRiskyLpDeposits(
  transactions: LpTransaction[],
  poolPositions: GroupedPoolPosition[],
  verdictsByPositionId: Record<string, PositionVerdict>,
): LpTransaction[] {
  return transactions.filter((tx) => {
    if (tx.operationType !== 'deposit') return false;

    const pool = poolPositions.find((p) => {
      const protocolMatch =
        p.protocol.toLowerCase().includes(tx.protocol.toLowerCase()) ||
        tx.protocol.toLowerCase().includes(p.protocol.split(' ')[0].toLowerCase());
      const labelMatch =
        tx.poolLabel.toLowerCase().includes(p.poolName.toLowerCase()) ||
        p.poolName.toLowerCase().includes(tx.poolLabel.toLowerCase()) ||
        p.pairLabel.toLowerCase().includes(tx.poolLabel.toLowerCase());
      return protocolMatch && (labelMatch || tx.poolLabel === 'LP');
    });

    if (!pool) return false;
    const verdict = verdictsByPositionId[pool.groupId];
    return verdict?.verdict === 'exit' || verdict?.verdict === 'reduce';
  });
}

export function riskyTransactionIds(
  transactions: LpTransaction[],
  poolPositions: GroupedPoolPosition[],
  verdictsByPositionId: Record<string, PositionVerdict>,
): Set<string> {
  return new Set(
    findRiskyLpDeposits(transactions, poolPositions, verdictsByPositionId).map((tx) => tx.id),
  );
}
