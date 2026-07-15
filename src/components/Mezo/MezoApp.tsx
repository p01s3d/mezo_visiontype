import { useCallback, useMemo, useRef, useState } from 'react';
import { TIMING } from './constants';
import './mezo.css';
import type { MezoActionType } from '../../data/mezoActions';
import { MEZO_ACTIONS } from '../../data/mezoActions';
import { MezoHeader } from './MezoHeader';
import { StripCanvas } from './StripCanvas';
import { ActionRail } from './ActionRail';
import { WealthBar } from './WealthBar';
import type { MezoColorScheme } from './mezoTheme';

export type ShowFilter = 'all' | 'active';
export type ViewMode = 'actions' | 'timeline';

export const MezoApp = () => {
  const [show, setShow] = useState<ShowFilter>('active');
  const [view, setView] = useState<ViewMode>('actions');
  const [typeFilter, setTypeFilter] = useState<MezoActionType | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [anticipatingId, setAnticipatingId] = useState<string | null>(null);
  const [scheme, setScheme] = useState<MezoColorScheme>('light');
  const anticipateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const actions = useMemo(
    () =>
      MEZO_ACTIONS.filter((a) => {
        if (show === 'active' && a.status !== 'active') return false;
        if (typeFilter !== null && a.type !== typeFilter) return false;
        return true;
      }),
    [show, typeFilter],
  );

  const clearAnticipation = useCallback(() => {
    if (anticipateTimer.current) {
      clearTimeout(anticipateTimer.current);
      anticipateTimer.current = null;
    }
    setAnticipatingId(null);
  }, []);

  const resetExpanded = useCallback(() => {
    clearAnticipation();
    setExpandedId(null);
  }, [clearAnticipation]);

  const handleShowChange = (next: ShowFilter) => {
    setShow(next);
    resetExpanded();
  };

  const handleViewChange = (next: ViewMode) => {
    setView(next);
    resetExpanded();
    if (next === 'timeline') setShow('all');
  };

  const handleTypeFilterChange = (next: MezoActionType | null) => {
    setTypeFilter(next);
    resetExpanded();
  };

  const handleToggle = useCallback(
    (id: string) => {
      clearAnticipation();

      if (expandedId === id) {
        setExpandedId(null);
        return;
      }

      // switching between expanded strips — no wind-up, just swap
      if (expandedId !== null) {
        setExpandedId(id);
        return;
      }

      // anticipation: brief squash before the expand spring
      setAnticipatingId(id);
      anticipateTimer.current = setTimeout(() => {
        setExpandedId(id);
        setAnticipatingId(null);
        anticipateTimer.current = null;
      }, TIMING.anticipationMs);
    },
    [clearAnticipation, expandedId],
  );

  return (
    <div className={`mezo-root${scheme === 'dark' ? ' is-dark' : ''}`}>
      <MezoHeader />
      <StripCanvas
        actions={actions}
        view={view}
        expandedId={expandedId}
        anticipatingId={anticipatingId}
        colorScheme={scheme}
        onToggle={handleToggle}
      />
      <ActionRail
        scheme={scheme}
        show={show}
        view={view}
        typeFilter={typeFilter}
        onToggleScheme={() => setScheme((s) => (s === 'light' ? 'dark' : 'light'))}
        onShowChange={handleShowChange}
        onViewChange={handleViewChange}
        onTypeFilterChange={handleTypeFilterChange}
      />
      <WealthBar />
    </div>
  );
};
