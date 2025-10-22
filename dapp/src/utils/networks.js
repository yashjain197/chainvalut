// Network configuration - Sepolia only
export const SEPOLIA_NETWORK = {
  chainId: '0xaa36a7',
  chainIdDecimal: 11155111,
  name: 'Sepolia Testnet',
  rpc: 'https://rpc.sepolia.org',
  explorer: 'https://sepolia.etherscan.io',
  contractAddress: '0x4Bb25877b98782B0c15CE79119c37a7ea84A986f',
};

export const switchToSepolia = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SEPOLIA_NETWORK.chainId }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: SEPOLIA_NETWORK.chainId,
            chainName: SEPOLIA_NETWORK.name,
            rpcUrls: [SEPOLIA_NETWORK.rpc],
            blockExplorerUrls: [SEPOLIA_NETWORK.explorer],
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH',
              decimals: 18,
            },
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
};
