import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, mainnet } from 'wagmi/chains';
import { http } from 'wagmi';

// Get WalletConnect Project ID from environment
// IMPORTANT: Get your own Project ID from https://cloud.walletconnect.com/
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// Warn in console if using placeholder
if (projectId === 'YOUR_PROJECT_ID' || projectId.length < 32) {
  console.warn(
    '⚠️ Please set VITE_WALLETCONNECT_PROJECT_ID in your .env file.\n' +
    'Get your Project ID from: https://cloud.walletconnect.com/'
  );
}

export const config = getDefaultConfig({
  appName: 'ChainVault',
  projectId: projectId,
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http('https://eth.llamarpc.com'),
    [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com', {
      timeout: 30000, // 30 second timeout
      retryCount: 3,
      retryDelay: 1000,
    }),
  },
  ssr: false,
});
