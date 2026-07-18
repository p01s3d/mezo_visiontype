export type PersonalPosition = {
  id: string;
  name: string;
  protocol: string;
  chain: string;
  valueUsd: number;
  debtUsd: number;
  positionType: string;
};

export type PoolPositionLeg = {
  id: string;
  groupId: string | null;
  fungibleId: string | null;
  name: string;
  symbol: string | null;
  protocol: string;
  protocolModule: string;
  protocolIconUrl: string | null;
  chain: string;
  valueUsd: number;
  change24hUsd: number | null;
  change24hPercent: number | null;
  unrealizedPnlUsd: number | null;
  positionType: string;
};

export type GroupedPoolPosition = {
  groupId: string;
  protocol: string;
  protocolIconUrl: string | null;
  poolName: string;
  pairLabel: string;
  chain: string;
  valueUsd: number;
  change24hUsd: number | null;
  change24hPercent: number | null;
  unrealizedPnlUsd: number | null;
  unrealizedPnlPercent: number | null;
  legs: PoolPositionLeg[];
};

export type LpOperationType = 'deposit' | 'withdraw' | 'claim';

export type LpTransaction = {
  id: string;
  title: string;
  protocol: string;
  poolLabel: string;
  operationType: LpOperationType;
  amountUsd: number;
  date: string;
  direction: 'in' | 'out';
  chain: string;
};

export type PersonalProtocolSummary = {
  id: string;
  protocol: string;
  chain: string;
  valueUsd: number;
  positionCount: number;
};

export type WalletToken = {
  id: string;
  fungibleId: string | null;
  chain: string;
  name: string;
  symbol: string;
  amount: number;
  price: number;
  valueUsd: number;
  logoUrl: string | null;
  isCore: boolean;
  change24hPercent?: number | null;
};
