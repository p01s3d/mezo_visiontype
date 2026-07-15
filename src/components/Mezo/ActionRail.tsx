import type { MezoActionType } from '../../data/mezoActions';
import type { MezoColorScheme } from './mezoTheme';
import type { ShowFilter, ViewMode } from './MezoApp';
import { ActionIcon, ActiveOnlyIcon, MoonIcon, SunIcon, TimelineIcon } from './icons';

const RAIL_ACTIONS: MezoActionType[] = ['loan', 'swap'];

type Props = {
  scheme: MezoColorScheme;
  show: ShowFilter;
  view: ViewMode;
  typeFilter: MezoActionType | null;
  onToggleScheme: () => void;
  onShowChange: (show: ShowFilter) => void;
  onViewChange: (view: ViewMode) => void;
  onTypeFilterChange: (type: MezoActionType | null) => void;
};

export const ActionRail = ({
  scheme,
  show,
  view,
  typeFilter,
  onToggleScheme,
  onShowChange,
  onViewChange,
  onTypeFilterChange,
}: Props) => (
  <aside className="mezo-rail">
    <button
      type="button"
      className="mezo-rail-btn"
      onClick={onToggleScheme}
      aria-label={scheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {scheme === 'light' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
    </button>

    <button
      type="button"
      className={`mezo-rail-btn${view === 'timeline' ? ' is-active' : ''}`}
      onClick={() => onViewChange(view === 'timeline' ? 'actions' : 'timeline')}
      aria-label={view === 'timeline' ? 'Show actions view' : 'Show timeline view'}
      aria-pressed={view === 'timeline'}
    >
      <TimelineIcon size={20} />
    </button>

    <button
      type="button"
      className={`mezo-rail-btn${show === 'active' ? ' is-active' : ''}`}
      onClick={() => onShowChange(show === 'active' ? 'all' : 'active')}
      aria-label={show === 'active' ? 'Show all transactions' : 'Show active only'}
      aria-pressed={show === 'active'}
    >
      <ActiveOnlyIcon size={20} />
    </button>

    <div className="mezo-rail-divider" aria-hidden />

    {RAIL_ACTIONS.map((type) => (
      <button
        key={type}
        type="button"
        className={`mezo-rail-btn${typeFilter === type ? ' is-active' : ''}`}
        onClick={() => onTypeFilterChange(typeFilter === type ? null : type)}
        aria-label={`Filter by ${type}`}
        aria-pressed={typeFilter === type}
      >
        <ActionIcon type={type} size={20} strokeWidth={1.6} />
      </button>
    ))}
  </aside>
);
