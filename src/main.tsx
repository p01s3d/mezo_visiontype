import '@coinbase/cds-icons/fonts/web/icon-font.css';
import '@coinbase/cds-web/globalStyles';
import '@coinbase/cds-web/defaultFontStyles';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { WalletProvider } from './wagmi/WalletProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
  </StrictMode>,
);
