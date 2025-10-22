import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { ethers } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../config';

export const useEnhancedWeb3 = () => {
  const { address, isConnected, chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [contract, setContract] = useState(null);
  const [balance, setBalance] = useState('0');
  const [ethBalance, setEthBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize contract
  useEffect(() => {
    if (!walletClient || !publicClient || !isConnected) {
      setContract(null);
      return;
    }

    const initContract = async () => {
      try {
        // Create ethers provider from viem clients
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        const contractInstance = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer
        );
        
        setContract(contractInstance);
      } catch (error) {
        console.error('Error initializing contract:', error);
      }
    };

    initContract();
  }, [walletClient, publicClient, isConnected, address]);

  // Update balances
  const updateBalances = useCallback(async () => {
    if (!address || !contract || !publicClient) return;

    try {
      setIsLoading(true);
      
      // Get both balances in parallel
      const [ethBal, contractBal] = await Promise.all([
        publicClient.getBalance({ address }),
        contract.balanceOf(address)
      ]);

      setEthBalance(ethers.formatEther(ethBal.toString()));
      setBalance(ethers.formatEther(contractBal.toString()));
    } catch (error) {
      console.error('Error updating balances:', error);
    } finally {
      setIsLoading(false);
    }
  }, [address, contract, publicClient]);

  // Auto-update balances when account or contract changes
  useEffect(() => {
    if (isConnected && address && contract) {
      updateBalances();
    } else {
      setBalance('0');
      setEthBalance('0');
    }
  }, [isConnected, address, contract, updateBalances]);

  return {
    address,
    isConnected,
    chain,
    contract,
    balance,
    ethBalance,
    isLoading,
    updateBalances,
  };
};
