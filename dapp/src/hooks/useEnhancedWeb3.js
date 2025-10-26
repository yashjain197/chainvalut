import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { ethers } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../contracts';

export const useEnhancedWeb3 = () => {
  const { address, isConnected, chain } = useAccount();
  const publicClient = usePublicClient();
  
  const [contract, setContract] = useState(null);
  const [balance, setBalance] = useState('0');
  const [ethBalance, setEthBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize contract
  useEffect(() => {
    if (!isConnected || !address) {
      console.log('Not connected or no address, skipping contract init');
      setContract(null);
      return;
    }

    const initContract = async () => {
      try {
        console.log('Initializing contract...');
        console.log('Address:', address);
        console.log('Contract Address:', CONTRACT_ADDRESS);
        
        if (!window.ethereum) {
          console.error('No ethereum provider found');
          return;
        }

        // Create ethers provider from window.ethereum
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        console.log('Signer address:', await signer.getAddress());
        
        const contractInstance = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer
        );
        
        console.log('✅ Contract initialized successfully');
        setContract(contractInstance);
      } catch (error) {
        console.error('❌ Error initializing contract:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
    };

    initContract();
  }, [isConnected, address]);

  // Update balances
  const updateBalances = useCallback(async () => {
    if (!address || !contract || !publicClient) {
      console.log('Cannot update balances:', { 
        hasAddress: !!address, 
        hasContract: !!contract, 
        hasPublicClient: !!publicClient 
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log('Fetching balances for:', address);
      console.log('Contract address:', CONTRACT_ADDRESS);
      console.log('Using publicClient:', !!publicClient);
      
      // Get wallet balance first
      const ethBal = await publicClient.getBalance({ address });
      console.log('Raw wallet balance:', ethBal);
      const formattedEthBalance = ethers.formatEther(ethBal.toString());
      console.log('Formatted wallet balance:', formattedEthBalance);

      // Get vault balance from contract
      console.log('Calling contract.balanceOf...');
      const contractBal = await contract.balanceOf(address);
      console.log('Raw vault balance:', contractBal);
      const formattedVaultBalance = ethers.formatEther(contractBal.toString());
      console.log('Formatted vault balance:', formattedVaultBalance);

      console.log('✅ Balances fetched successfully:', {
        walletBalance: formattedEthBalance,
        vaultBalance: formattedVaultBalance
      });

      // Update state
      setEthBalance(formattedEthBalance);
      setBalance(formattedVaultBalance);
      console.log('✅ State updated with new balances');
    } catch (error) {
      console.error('❌ Error updating balances:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        data: error.data,
        stack: error.stack,
        address: address,
        contractAddress: CONTRACT_ADDRESS
      });
      
      // Set to 0 on error but don't crash
      setEthBalance('0');
      setBalance('0');
    } finally {
      setIsLoading(false);
    }
  }, [address, contract, publicClient]);

  // Auto-update balances when account or contract changes
  useEffect(() => {
    if (isConnected && address && contract && publicClient) {
      console.log('Triggering initial balance fetch...');
      updateBalances();
      
      // Set up polling every 10 seconds
      const pollInterval = setInterval(() => {
        console.log('Polling balances...');
        updateBalances();
      }, 10000);

      // Cleanup on unmount
      return () => {
        clearInterval(pollInterval);
      };
    } else {
      console.log('Not ready to fetch balances:', {
        isConnected,
        hasAddress: !!address,
        hasContract: !!contract,
        hasPublicClient: !!publicClient
      });
      setBalance('0');
      setEthBalance('0');
    }
  }, [isConnected, address, contract, publicClient, updateBalances]);

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
