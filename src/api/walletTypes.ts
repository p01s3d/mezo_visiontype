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
