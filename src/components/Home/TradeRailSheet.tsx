import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button } from '@coinbase/cds-web/buttons';

/** Height of the docked bar. Main content reserves this much so the footer stays reachable. */
export const TRADE_SHEET_BAR_HEIGHT = 72;

const BAR_STYLE: CSSProperties = {
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 30,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: TRADE_SHEET_BAR_HEIGHT,
  paddingLeft: 16,
  paddingRight: 16,
  borderTop: '1px solid var(--color-bgLine)',
  background: 'var(--color-bg)',
};

const BACKDROP_STYLE: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 40,
  background: 'rgba(0, 0, 0, 0.44)',
};

const PANEL_STYLE: CSSProperties = {
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 50,
  // Centred and capped so the 360px rail reads as a deliberate sheet rather than a
  // narrow column stranded in a full-width panel on tablet-width screens.
  maxWidth: 460,
  marginInline: 'auto',
  maxHeight: '85vh',
  overflowY: 'auto',
  background: 'var(--color-bg)',
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  border: '1px solid var(--color-bgLine)',
  borderBottom: 'none',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const HANDLE_STYLE: CSSProperties = {
  width: 40,
  height: 4,
  borderRadius: 999,
  background: 'var(--color-bgLine)',
  margin: '10px auto 0',
  flexShrink: 0,
};

/**
 * Below the rail breakpoint the trade rail leaves the grid and docks to the bottom
 * of the viewport, so the main column gets the full width back without the trade
 * actions becoming unreachable.
 */
export function TradeRailSheet({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Escape closes; body scroll is locked while the sheet covers the page.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  return (
    <>
      <div style={BAR_STYLE}>
        <Button
          ref={triggerRef}
          alignSelf="stretch"
          aria-expanded={open}
          aria-haspopup="dialog"
          borderRadius={200}
          onClick={() => setOpen(true)}
          variant="primary"
          style={{ flex: 1, maxWidth: 480 }}
        >
          Buy
        </Button>
      </div>

      {open ? (
        <>
          <div aria-hidden onClick={close} style={BACKDROP_STYLE} />
          <div
            ref={panelRef}
            aria-label="Trade"
            aria-modal="true"
            role="dialog"
            style={PANEL_STYLE}
            tabIndex={-1}
          >
            <div aria-hidden style={HANDLE_STYLE} />
            {children}
          </div>
        </>
      ) : null}
    </>
  );
}
