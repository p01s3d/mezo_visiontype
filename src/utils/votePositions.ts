import type { PersonalPosition, WalletToken } from '../api/walletTypes';
import { formatChain } from './personalPositions';

const GOVERNANCE_POSITION_PATTERN = /governance|vote|delegat|escrow|\bve/i;

export const GOVERNANCE_TOKEN_SYMBOLS = new Set([
  '1INCH',
  'AAVE',
  'ARB',
  'BAL',
  'COMP',
  'CRV',
  'CVX',
  'DYDX',
  'ENS',
  'FXS',
  'GMX',
  'LDO',
  'MKR',
  'OP',
  'PENDLE',
  'RPL',
  'SNX',
  'SUSHI',
  'UNI',
  'YFI',
  'ZRX',
]);

const PROTOCOL_BY_SYMBOL: Record<string, string> = {
  '1INCH': '1inch',
  AAVE: 'Aave',
  ARB: 'Arbitrum',
  BAL: 'Balancer',
  COMP: 'Compound',
  CRV: 'Curve',
  CVX: 'Convex',
  DYDX: 'dYdX',
  ENS: 'ENS',
  FXS: 'Frax',
  GMX: 'GMX',
  LDO: 'Lido',
  MKR: 'Maker',
  OP: 'Optimism',
  PENDLE: 'Pendle',
  RPL: 'Rocket Pool',
  SNX: 'Synthetix',
  SUSHI: 'SushiSwap',
  UNI: 'Uniswap',
  YFI: 'yearn.finance',
  ZRX: '0x',
};

export type VoteRow = {
  id: string;
  protocol: string;
  chain: string;
  positionLabel: string;
  valueUsd: number;
};

export function isGovernancePosition(position: PersonalPosition): boolean {
  return (
    GOVERNANCE_POSITION_PATTERN.test(position.positionType) ||
    GOVERNANCE_POSITION_PATTERN.test(position.name)
  );
}

export function filterGovernancePositions(positions: PersonalPosition[]): PersonalPosition[] {
  return positions.filter(isGovernancePosition);
}

export function isGovernanceWalletToken(token: WalletToken): boolean {
  return GOVERNANCE_TOKEN_SYMBOLS.has(token.symbol.toUpperCase());
}

export function filterGovernanceWalletTokens(tokens: WalletToken[]): WalletToken[] {
  return tokens.filter(isGovernanceWalletToken);
}

function protocolLabelForToken(token: WalletToken): string {
  return PROTOCOL_BY_SYMBOL[token.symbol.toUpperCase()] ?? token.name;
}

export function voteRowFromPersonalPosition(position: PersonalPosition): VoteRow {
  return {
    id: `position:${position.id}`,
    protocol: position.protocol,
    chain: position.chain,
    positionLabel: position.name,
    valueUsd: position.valueUsd,
  };
}

export function voteRowFromWalletToken(token: WalletToken): VoteRow {
  return {
    id: `token:${token.id}`,
    protocol: protocolLabelForToken(token),
    chain: token.chain,
    positionLabel: token.symbol,
    valueUsd: token.valueUsd,
  };
}

export function buildVoteRows(
  positions: PersonalPosition[],
  tokens: WalletToken[],
): VoteRow[] {
  const rows = [
    ...filterGovernancePositions(positions).map(voteRowFromPersonalPosition),
    ...filterGovernanceWalletTokens(tokens).map(voteRowFromWalletToken),
  ];

  return rows.sort((a, b) => b.valueUsd - a.valueUsd);
}

export function voteTotalValue(positions: PersonalPosition[], tokens: WalletToken[]): number {
  return buildVoteRows(positions, tokens).reduce((sum, row) => sum + row.valueUsd, 0);
}

export { formatChain };
