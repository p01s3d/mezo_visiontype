import type { LottieComponentProps } from 'lottie-react';
import borrowAnimation from '../assets/icons/001 Finance/01 Stroke (Regular)/coin.json';
import holdingsAnimation from '../assets/icons/001 Finance/01 Stroke (Regular)/chart 03.json';
import transactionsAnimation from '../assets/icons/001 Finance/01 Stroke (Regular)/receipt 2.json';
import lockAnimation from '../assets/nav/lock.json';
import overviewAnimation from '../assets/icons/001 Finance/01 Stroke (Regular)/chart 1.json';
import vaultsAnimation from '../assets/icons/001 Finance/01 Stroke (Regular)/strongbox 2.json';
import marketAnimation from '../assets/icons/002 Commerce/01 Stroke (Regular)/shop.json';
import exploreAnimation from '../assets/icons/003 Location/01 Stroke (Regular)/discover.json';
import poolsAnimation from '../assets/icons/030 Weather/01 Stroke (Regular)/wind-2.json';
import rewardsAnimation from '../assets/icons/023 Power/01 Stroke (Regular)/flash.json';
import voteAnimation from '../assets/icons/024 warning check/01 Stroke (Regular)/tick-square.json';

export type NavAnimation = LottieComponentProps['animationData'];

export const NAV_ANIMATIONS = {
  overview: overviewAnimation,
  holdings: holdingsAnimation,
  transactions: transactionsAnimation,
  borrow: borrowAnimation,
  market: marketAnimation,
  rewards: rewardsAnimation,
  explore: exploreAnimation,
  lock: lockAnimation,
  vote: voteAnimation,
  pools: poolsAnimation,
  vaults: vaultsAnimation,
} as const satisfies Record<string, NavAnimation>;

export type NavIconId = keyof typeof NAV_ANIMATIONS;
