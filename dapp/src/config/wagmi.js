import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, mainnet } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'ChainVault',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', // Fallback for dev
  chains: [sepolia, mainnet],
  ssr: false,
});
