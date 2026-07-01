export type DeFiPosition = {
  id: string;
  name: string;
  protocol: string;
  asset: string;
  valueUsd: string;
  apy: string;
  active: boolean;
};

export const mockPositions: DeFiPosition[] = [
  {
    id: '1',
    name: 'ETH / USDC LP',
    protocol: 'Uniswap V3',
    asset: 'ETH, USDC',
    valueUsd: '24,580.42',
    apy: '12.4%',
    active: true,
  },
  {
    id: '2',
    name: 'stETH Staking',
    protocol: 'Lido',
    asset: 'stETH',
    valueUsd: '18,200.00',
    apy: '3.2%',
    active: true,
  },
  {
    id: '3',
    name: 'USDC Supply',
    protocol: 'Aave V3',
    asset: 'USDC',
    valueUsd: '10,500.00',
    apy: '4.8%',
    active: true,
  },
  {
    id: '4',
    name: 'WBTC / ETH LP',
    protocol: 'Curve',
    asset: 'WBTC, ETH',
    valueUsd: '8,340.18',
    apy: '8.1%',
    active: true,
  },
  {
    id: '5',
    name: 'DAI Vault',
    protocol: 'MakerDAO',
    asset: 'DAI',
    valueUsd: '5,000.00',
    apy: '2.1%',
    active: false,
  },
  {
    id: '6',
    name: 'ARB Staking',
    protocol: 'Arbitrum',
    asset: 'ARB',
    valueUsd: '3,120.55',
    apy: '6.5%',
    active: true,
  },
  {
    id: '7',
    name: 'LINK Supply',
    protocol: 'Compound',
    asset: 'LINK',
    valueUsd: '2,890.00',
    apy: '1.9%',
    active: false,
  },
  {
    id: '8',
    name: 'MATIC / USDC LP',
    protocol: 'Balancer',
    asset: 'MATIC, USDC',
    valueUsd: '1,750.30',
    apy: '15.2%',
    active: true,
  },
];
