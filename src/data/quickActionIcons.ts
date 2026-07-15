import type { LottieComponentProps } from 'lottie-react';
import depositAnimation from '../assets/icons/004 Building/01 Stroke (Regular)/bank.json';
import sendAnimation from '../assets/icons/006 Arrows/01 Stroke (Regular)/arrow-up.json';
import receiveAnimation from '../assets/icons/006 Arrows/01 Stroke (Regular)/arrow-down.json';
import withdrawAnimation from '../assets/icons/001 Finance/01 Stroke (Regular)/money remove.json';

export type QuickActionAnimation = LottieComponentProps['animationData'];

export const QUICK_ACTION_ANIMATIONS = {
  send: sendAnimation,
  receive: receiveAnimation,
  deposit: depositAnimation,
  withdraw: withdrawAnimation,
} as const;

export type QuickActionIconId = keyof typeof QUICK_ACTION_ANIMATIONS;

export const QUICK_ACTIONS = [
  { id: 'send' as const, label: 'Send crypto' },
  { id: 'receive' as const, label: 'Receive crypto' },
  { id: 'deposit' as const, label: 'Deposit cash' },
  { id: 'withdraw' as const, label: 'Withdraw cash' },
];

export function getQuickActionAnimation(id: QuickActionIconId) {
  return QUICK_ACTION_ANIMATIONS[id];
}
