import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type TradeTab = 'buy' | 'sell' | 'convert';

export type TradeIntent = {
  tab: TradeTab;
  assetSymbol: string;
  assetLabel: string;
};

type TradeIntentContextValue = {
  intent: TradeIntent | null;
  setTradeIntent: (intent: TradeIntent) => void;
  clearTradeIntent: () => void;
};

const TradeIntentContext = createContext<TradeIntentContextValue | null>(null);

export function TradeIntentProvider({ children }: { children: ReactNode }) {
  const [intent, setIntent] = useState<TradeIntent | null>(null);

  const setTradeIntent = useCallback((next: TradeIntent) => {
    setIntent(next);
  }, []);

  const clearTradeIntent = useCallback(() => setIntent(null), []);

  const value = useMemo(
    () => ({ intent, setTradeIntent, clearTradeIntent }),
    [intent, setTradeIntent, clearTradeIntent],
  );

  return <TradeIntentContext.Provider value={value}>{children}</TradeIntentContext.Provider>;
}

export function useTradeIntent(): TradeIntentContextValue {
  const ctx = useContext(TradeIntentContext);
  if (!ctx) {
    return {
      intent: null,
      setTradeIntent: () => undefined,
      clearTradeIntent: () => undefined,
    };
  }
  return ctx;
}
