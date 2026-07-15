import type { WalletToken } from '../api/walletTypes';

export const DEMO_NET_WORTH_USD = 12_847.52;

export const DEMO_WALLET_TOKENS: WalletToken[] = [
  {
    id: 'demo-btc',
    chain: 'ethereum',
    name: 'Bitcoin',
    symbol: 'BTC',
    amount: 0.12,
    price: 91_694.54,
    valueUsd: 11_003.34,
    logoUrl: 'https://assets.coincap.io/assets/icons/btc@2x.png',
    isCore: true,
  },
  {
    id: 'demo-eth',
    chain: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    amount: 0.35,
    price: 3_456.12,
    valueUsd: 1_209.64,
    logoUrl: 'https://assets.coincap.io/assets/icons/eth@2x.png',
    isCore: true,
  },
  {
    id: 'demo-usdc',
    chain: 'ethereum',
    name: 'USDC',
    symbol: 'USDC',
    amount: 520,
    price: 1,
    valueUsd: 520,
    logoUrl: 'https://assets.coincap.io/assets/icons/usdc@2x.png',
    isCore: true,
  },
  {
    id: 'demo-link',
    chain: 'ethereum',
    name: 'Chainlink',
    symbol: 'LINK',
    amount: 6.2,
    price: 18.5,
    valueUsd: 114.7,
    logoUrl: null,
    isCore: false,
  },
];
