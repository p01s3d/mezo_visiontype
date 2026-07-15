export type TransactionDirection = 'in' | 'out';

export type Transaction = {
  id: string;
  title: string;
  symbol?: string;
  logoUrl?: string | null;
  amountUsd: number;
  amountToken?: number;
  tokenSymbol?: string;
  date: string;
  direction: TransactionDirection;
};

export const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-eth-buy-1',
    title: 'Bought ETH',
    symbol: 'ETH',
    logoUrl: 'https://assets.coincap.io/assets/icons/eth@2x.png',
    amountUsd: 3,
    amountToken: 0.00057357,
    tokenSymbol: 'ETH',
    date: '2024-11-01T14:22:00.000Z',
    direction: 'in',
  },
  {
    id: 'tx-eth-buy-2',
    title: 'Bought ETH',
    symbol: 'ETH',
    logoUrl: 'https://assets.coincap.io/assets/icons/eth@2x.png',
    amountUsd: 3,
    amountToken: 0.00057357,
    tokenSymbol: 'ETH',
    date: '2024-11-01T10:05:00.000Z',
    direction: 'in',
  },
  {
    id: 'tx-deposit-1',
    title: 'Deposited funds',
    amountUsd: 3,
    date: '2024-11-01T08:15:00.000Z',
    direction: 'in',
  },
  {
    id: 'tx-btc-buy-1',
    title: 'Bought BTC',
    symbol: 'BTC',
    logoUrl: 'https://assets.coincap.io/assets/icons/btc@2x.png',
    amountUsd: 50,
    amountToken: 0.000545,
    tokenSymbol: 'BTC',
    date: '2024-10-28T16:40:00.000Z',
    direction: 'in',
  },
  {
    id: 'tx-usdc-receive',
    title: 'Received USDC',
    symbol: 'USDC',
    logoUrl: 'https://assets.coincap.io/assets/icons/usdc@2x.png',
    amountUsd: 120,
    amountToken: 120,
    tokenSymbol: 'USDC',
    date: '2024-10-25T09:12:00.000Z',
    direction: 'in',
  },
  {
    id: 'tx-eth-send',
    title: 'Sent ETH',
    symbol: 'ETH',
    logoUrl: 'https://assets.coincap.io/assets/icons/eth@2x.png',
    amountUsd: 24.5,
    amountToken: 0.0071,
    tokenSymbol: 'ETH',
    date: '2024-10-20T18:30:00.000Z',
    direction: 'out',
  },
];
