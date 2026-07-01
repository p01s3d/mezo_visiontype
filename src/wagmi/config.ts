import { createConfig, http } from 'wagmi';
import { arbitrum, base, mainnet } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [mainnet, arbitrum, base],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
  },
});
