import '@coinbase/cds-icons/fonts/web/icon-font.css';
import './assets/fonts/cream/font-face.css';
import './assets/fonts/riforma/font-face.css';
import './theme/fonts.css';
import '@coinbase/cds-web/globalStyles';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { WalletProvider } from './wagmi/WalletProvider';
import { migrateChartCacheAlignment, purgeAllWalletLocalStorage } from './utils/walletDataCache';

purgeAllWalletLocalStorage();
migrateChartCacheAlignment();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
  </StrictMode>,
);
