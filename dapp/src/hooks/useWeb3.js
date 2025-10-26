import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ABI } from '../contracts';
import { SEPOLIA_NETWORK, switchToSepolia } from '../utils/networks';

export const useWeb3 = () => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [balance, setBalance] = useState('0');
  const [ethBalance, setEthBalance] = useState('0');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install it to use this app.');
      }

      // Request accounts first
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      
      // Auto-switch to Sepolia if not on it
      if (chainId !== SEPOLIA_NETWORK.chainIdDecimal) {
        await switchToSepolia();
        // Reload to get new network
        window.location.reload();
        return;
      }

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        SEPOLIA_NETWORK.contractAddress, 
        CONTRACT_ABI, 
        signer
      );

      setAccount(accounts[0]);
      setProvider(provider);
      setSigner(signer);
      setContract(contract);

      // Get balances in parallel for faster loading
      const [ethBal, contractBal] = await Promise.all([
        provider.getBalance(accounts[0]),
        contract.balanceOf(accounts[0])
      ]);

      setEthBalance(ethers.formatEther(ethBal));
      setBalance(ethers.formatEther(contractBal));

    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setBalance('0');
    setEthBalance('0');
  };

  const updateBalances = useCallback(async () => {
    if (!account || !provider || !contract) return;

    try {
      const ethBal = await provider.getBalance(account);
      setEthBalance(ethers.formatEther(ethBal));

      const contractBal = await contract.balanceOf(account);
      setBalance(ethers.formatEther(contractBal));
    } catch (err) {
      console.error('Error updating balances:', err);
    }
  }, [account, provider, contract]);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        updateBalances();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [account, updateBalances]);

  return {
    account,
    provider,
    signer,
    contract,
    balance,
    ethBalance,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    updateBalances,
  };
};
