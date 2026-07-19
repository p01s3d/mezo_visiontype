import type { PersonalPosition } from '../api/walletTypes';
import { DEMO_WALLET_TOKENS } from './demoPortfolio';
import { borrowTotalDebt, filterPersonalPositions } from '../utils/personalPositions';
import { voteTotalValue } from '../utils/votePositions';

export const DEMO_PERSONAL_POSITIONS: PersonalPosition[] = [
  {
    id: 'demo-aave-usdc-supply',
    name: 'USDC supply',
    protocol: 'Aave V3',
    chain: 'ethereum',
    valueUsd: 5_200,
    debtUsd: 0,
    positionType: 'supply',
  },
  {
    id: 'demo-aave-eth-borrow',
    name: 'ETH borrow',
    protocol: 'Aave V3',
    chain: 'ethereum',
    valueUsd: 890,
    debtUsd: 890,
    positionType: 'borrow',
  },
  {
    id: 'demo-comp-usdc',
    name: 'USDC lend',
    protocol: 'Compound V3',
    chain: 'ethereum',
    valueUsd: 820,
    debtUsd: 0,
    positionType: 'lend',
  },
  {
    id: 'demo-morpho-weth',
    name: 'WETH deposit',
    protocol: 'Morpho',
    chain: 'ethereum',
    valueUsd: 2_150,
    debtUsd: 0,
    positionType: 'deposit',
  },
  {
    id: 'demo-uniswap-delegate',
    name: 'UNI delegation',
    protocol: 'Uniswap',
    chain: 'ethereum',
    valueUsd: 340,
    debtUsd: 0,
    positionType: 'governance',
  },
  {
    id: 'demo-aave-vote',
    name: 'AAVE vote escrow',
    protocol: 'Aave',
    chain: 'ethereum',
    valueUsd: 180,
    debtUsd: 0,
    positionType: 'governance',
  },
];

export function demoBorrowPositions(): PersonalPosition[] {
  return filterPersonalPositions(DEMO_PERSONAL_POSITIONS, 'borrow', '');
}

export const DEMO_BORROW_DEBT_USD = borrowTotalDebt(DEMO_PERSONAL_POSITIONS);

export const DEMO_VOTE_VALUE_USD = voteTotalValue(DEMO_PERSONAL_POSITIONS, DEMO_WALLET_TOKENS);
