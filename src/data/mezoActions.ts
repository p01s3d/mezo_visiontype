export type MezoActionType =
  | 'deposit'
  | 'loan'
  | 'bridge'
  | 'stake'
  | 'transfer'
  | 'swap';

export type MezoActionStatus = 'active' | 'completed';

export type ScheduleState = 'complete' | 'pending' | 'upcoming';

export type ScheduleEntry = {
  date: string;
  amount: number;
  state: ScheduleState;
};

export type LoanDetail = {
  progressPct: number;
  progressLabel: string;
  totalSteps: number;
  completedSteps: number;
  schedule: ScheduleEntry[];
  interestSaved: number;
  payedFrom: string;
  paymentDate: string;
  loanHealth: string;
  /** 0..1 position of the marker on the health gradient */
  loanHealthPosition: number;
};

export type MezoAction = {
  id: string;
  type: MezoActionType;
  /** user-given nickname, e.g. "A gift" */
  nickname?: string;
  amount: number;
  /** day of October 2025, drives timeline position */
  day: number;
  dateLabel: string;
  status: MezoActionStatus;
  loanDetail?: LoanDetail;
};

export const MEZO_ACTIONS: MezoAction[] = [
  { id: 'deposit-2450', type: 'deposit', amount: 2450, day: 1, dateLabel: '1 Oct', status: 'completed' },
  { id: 'stake-519', type: 'stake', amount: 519, day: 2, dateLabel: '2 Oct', status: 'active' },
  { id: 'swap-812', type: 'swap', amount: 812, day: 3, dateLabel: '3 Oct', status: 'completed' },
  {
    id: 'loan-new-car',
    type: 'loan',
    nickname: 'New car',
    amount: 1428,
    day: 4,
    dateLabel: '4 Oct',
    status: 'active',
    loanDetail: {
      progressPct: 12,
      progressLabel: 'on track',
      totalSteps: 8,
      completedSteps: 1,
      schedule: [
        { date: '10/01/25', amount: 178.5, state: 'complete' },
        { date: '11/01/25', amount: 178.5, state: 'pending' },
        { date: '12/01/25', amount: 178.5, state: 'upcoming' },
      ],
      interestSaved: 42.1,
      payedFrom: 'linked account',
      paymentDate: '1st',
      loanHealth: '1:82',
      loanHealthPosition: 0.55,
    },
  },
  { id: 'transfer-560', type: 'transfer', amount: 560, day: 5, dateLabel: '5 Oct', status: 'active' },
  { id: 'swap-639', type: 'swap', amount: 639, day: 6, dateLabel: '6 Oct', status: 'active' },
  { id: 'bridge-1740', type: 'bridge', amount: 1740, day: 7, dateLabel: '7 Oct', status: 'completed' },
  {
    id: 'loan-a-gift',
    type: 'loan',
    nickname: 'A gift',
    amount: 2840,
    day: 8,
    dateLabel: '8 Oct',
    status: 'active',
    loanDetail: {
      progressPct: 35,
      progressLabel: 'on track',
      totalSteps: 8,
      completedSteps: 6,
      schedule: [
        { date: '05/01/25', amount: 105.12, state: 'complete' },
        { date: '06/01/25', amount: 105.12, state: 'complete' },
        { date: '07/01/25', amount: 105.12, state: 'complete' },
        { date: '08/01/25', amount: 105.12, state: 'complete' },
        { date: '09/01/25', amount: 105.12, state: 'complete' },
        { date: '10/01/25', amount: 105.12, state: 'complete' },
        { date: '10/02/25', amount: 105.12, state: 'pending' },
        { date: '11/02/25', amount: 105.12, state: 'upcoming' },
      ],
      interestSaved: 124.56,
      payedFrom: 'linked account',
      paymentDate: '10th',
      loanHealth: '1:95',
      loanHealthPosition: 0.32,
    },
  },
  { id: 'transfer-1000', type: 'transfer', amount: 1000, day: 10, dateLabel: '10 Oct', status: 'active' },
  { id: 'deposit-905', type: 'deposit', amount: 905, day: 11, dateLabel: '11 Oct', status: 'completed' },
  { id: 'deposit-1291', type: 'deposit', amount: 1291, day: 12, dateLabel: '12 Oct', status: 'completed' },
  { id: 'stake-1216', type: 'stake', amount: 1216, day: 13, dateLabel: '13 Oct', status: 'active' },
  { id: 'bridge-982', type: 'bridge', amount: 982, day: 15, dateLabel: '15 Oct', status: 'completed' },
  { id: 'transfer-2105', type: 'transfer', amount: 2105, day: 16, dateLabel: '16 Oct', status: 'completed' },
  { id: 'swap-3014', type: 'swap', amount: 3014, day: 17, dateLabel: '17 Oct', status: 'completed' },
  { id: 'swap-478', type: 'swap', amount: 478, day: 18, dateLabel: '18 Oct', status: 'active' },
  { id: 'stake-3005', type: 'stake', amount: 3005, day: 19, dateLabel: '19 Oct', status: 'active' },
  { id: 'deposit-1321', type: 'deposit', amount: 1321, day: 20, dateLabel: '20 Oct', status: 'completed' },
  { id: 'bridge-1333', type: 'bridge', amount: 1333, day: 21, dateLabel: '21 Oct', status: 'completed' },
  {
    id: 'loan-little-treat',
    type: 'loan',
    nickname: 'Little Treat',
    amount: 3250.58,
    day: 22,
    dateLabel: '22 Oct',
    status: 'active',
    loanDetail: {
      progressPct: 8,
      progressLabel: 'on track',
      totalSteps: 10,
      completedSteps: 1,
      schedule: [
        { date: '10/15/25', amount: 325.06, state: 'complete' },
        { date: '11/15/25', amount: 325.06, state: 'pending' },
        { date: '12/15/25', amount: 325.06, state: 'upcoming' },
      ],
      interestSaved: 18.75,
      payedFrom: 'linked account',
      paymentDate: '15th',
      loanHealth: '1:78',
      loanHealthPosition: 0.62,
    },
  },
];

export const TOTAL_WEALTH = 316463;
export const REWARDS = 12552;

/** Wealth per day of October, ending today (Oct 22). Drives the timeline chart. */
export type WealthPoint = { day: number; value: number };

export const WEALTH_SERIES: WealthPoint[] = [
  { day: 1, value: 262400 },
  { day: 2, value: 268900 },
  { day: 3, value: 265100 },
  { day: 4, value: 259800 },
  { day: 5, value: 263500 },
  { day: 6, value: 271200 },
  { day: 7, value: 268400 },
  { day: 8, value: 274900 },
  { day: 9, value: 270300 },
  { day: 10, value: 265800 },
  { day: 11, value: 272600 },
  { day: 12, value: 279400 },
  { day: 13, value: 286100 },
  { day: 14, value: 291800 },
  { day: 15, value: 298700 },
  { day: 16, value: 288400 },
  { day: 17, value: 295600 },
  { day: 18, value: 302900 },
  { day: 19, value: 309200 },
  { day: 20, value: 304100 },
  { day: 21, value: 312800 },
  { day: 22, value: 316463 },
];

export const TIMELINE_TICKS: { day: number; label: string }[] = [
  { day: 8, label: 'Oct 2w' },
  { day: 15, label: 'Oct 3w' },
  { day: 22, label: 'Today' },
];

export const TIMELINE_DOMAIN = { min: 1, max: 22 };

export const ACTION_LABELS: Record<MezoActionType, string> = {
  deposit: 'Deposit',
  loan: 'Loan',
  bridge: 'Bridge',
  stake: 'Stake',
  transfer: 'Transfer',
  swap: 'Swap',
};

export function formatAmount(value: number): string {
  const hasCents = value % 1 !== 0;
  // the reference UI writes strip amounts without thousand separators ($1428)
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
    useGrouping: false,
  })}`;
}
