import type { MezoActionType } from '../../data/mezoActions';

type IconProps = {
  size?: number;
  strokeWidth?: number;
};

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

const PATHS: Record<MezoActionType, string[]> = {
  deposit: ['M12 4v14', 'M6 13l6 6 6-6'],
  loan: ['M7 17L17 7', 'M9 7h8v8'],
  bridge: ['M20 12a8 8 0 0 1-14.9 4', 'M4 12a8 8 0 0 1 14.9-4', 'M4.6 20v-4h4', 'M19.4 4v4h-4'],
  stake: ['M3 16l5.5-5.5 4 4L20 7', 'M14.5 7H20v5.5'],
  transfer: ['M4 17c0-6.5 6-9 13-9', 'M13 4l4 4-4 4'],
  swap: ['M7 4L3 8l4 4', 'M3.5 8H17', 'M17 20l4-4-4-4', 'M20.5 16H7'],
};

export const ActionIcon = ({
  type,
  size = 14,
  strokeWidth = 1.8,
}: IconProps & { type: MezoActionType }) => (
  <svg {...base(size)} strokeWidth={strokeWidth}>
    {PATHS[type].map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
);

export const MenuIcon = ({ size = 13 }: IconProps) => (
  <svg {...base(size)} strokeWidth={1.6}>
    <path d="M4 8h16" />
    <path d="M4 16h16" />
  </svg>
);

export const BarsIcon = ({ size = 12 }: IconProps) => (
  <svg {...base(size)} strokeWidth={1.6}>
    <path d="M5 10v4" />
    <path d="M9 7v10" />
    <path d="M13 10v4" />
  </svg>
);

/** timeline view toggle */
export const TimelineIcon = ({ size = 16, strokeWidth = 1.7 }: IconProps) => (
  <svg {...base(size)} strokeWidth={strokeWidth}>
    <path d="M4 18V8" />
    <path d="M10 18V5" />
    <path d="M16 18v-7" />
    <path d="M3 18h18" />
  </svg>
);

/** active-only filter */
export const ActiveOnlyIcon = ({ size = 16, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size)} strokeWidth={strokeWidth}>
    <circle cx="12" cy="12" r="7" />
    <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
  </svg>
);

export const BoltIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2L4.5 13.5H11L9.5 22 19 10h-6.5L13 2z" />
  </svg>
);

/** crown — rewards marker */
export const CrownIcon = ({ size = 16, strokeWidth = 1.9 }: IconProps) => (
  <svg {...base(size)} strokeWidth={strokeWidth} aria-hidden>
    <path d="M4 18h16" />
    <path d="M6 18l1.2-8.2 4.8 4.2L12 6l3 8 4.8-4.2L21 18" />
  </svg>
);

/** portfolio bar-chart mark */
export const PortfolioMark = ({ size = 20 }: IconProps) => (
  <svg
    aria-hidden
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect fill="currentColor" height="5" rx="1.5" width="4" x="3" y="14" />
    <rect fill="currentColor" height="9" rx="1.5" width="4" x="10" y="10" />
    <rect fill="currentColor" height="13" rx="1.5" width="4" x="17" y="6" />
  </svg>
);

export const SunIcon = ({ size = 16 }: IconProps) => (
  <svg {...base(size)} strokeWidth={1.8}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

export const MoonIcon = ({ size = 16 }: IconProps) => (
  <svg {...base(size)} strokeWidth={1.8}>
    <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a6.5 6.5 0 1 0 11.5 11.5z" />
  </svg>
);

export const GiftIcon = ({ size = 44 }: IconProps) => (
  <svg {...base(size)} strokeWidth={1.4}>
    <rect x="4" y="9" width="16" height="12" rx="2" />
    <path d="M4 13h16" />
    <path d="M12 9v12" />
    <path d="M12 9c-1.5-3.5-6-4-6-1.2C6 10 9.5 9 12 9z" />
    <path d="M12 9c1.5-3.5 6-4 6-1.2C18 10 14.5 9 12 9z" />
  </svg>
);

export const MezoSquiggle = ({ width = 22 }: { width?: number }) => (
  <svg
    width={width}
    height={width * 0.5}
    viewBox="0 0 24 12"
    fill="none"
    stroke="#E1383D"
    strokeWidth={3.4}
    strokeLinecap="round"
  >
    <path d="M2 8c2.5-5 4.5-5 7 0s4.5 5 7 0 3-4.2 6-2" />
  </svg>
);
