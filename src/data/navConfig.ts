import type { DataSource } from '../components/AssetList';
import type { DataView } from '../utils/defiViews';
import { NAV_ANIMATIONS, type NavIconId } from './navIcons';

export type NavEntry = {
  id: NavIconId;
  title: string;
  dataSource: DataSource;
  view: DataView;
};

export const MAIN_NAV: NavEntry[] = [
  { id: 'overview', title: 'Home', dataSource: 'home', view: 'dashboard' },
  { id: 'holdings', title: 'My assets', dataSource: 'holdings', view: 'dashboard' },
  { id: 'transactions', title: 'Transactions', dataSource: 'transactions', view: 'dashboard' },
  { id: 'borrow', title: 'Borrow', dataSource: 'personal', view: 'borrow' },
];

export const EARN_NAV: NavEntry[] = [
  { id: 'pools', title: 'Pools', dataSource: 'personal', view: 'liquidity' },
];

export const ALL_NAV = [...MAIN_NAV, ...EARN_NAV];

export function getNavAnimation(id: NavIconId) {
  return NAV_ANIMATIONS[id];
}
