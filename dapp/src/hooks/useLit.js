import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import {
  initializeLit,
  disconnectLit,
  encryptString,
  decryptString,
  encryptJSON,
  decryptJSON,
  createAccessControlConditions,
  createMultiPartyAccessControl,
  checkAccess,
} from '../utils/lit';

/**
 * React Hook for Lit Protocol
 * Provides encryption/decryption capabilities
 */
export function useLit() {
  const { address, isConnected } = useAccount();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState(null);

  // Initialize Lit Protocol when wallet connects
  useEffect(() => {
    if (isConnected && !isInitialized && !isInitializing) {
      initialize();
    }

    return () => {
      if (isInitialized) {
        disconnectLit();
      }
    };
  }, [isConnected, isInitialized, isInitializing]);

  const initialize = async () => {
    try {
      setIsInitializing(true);
      setError(null);
      await initializeLit();
      setIsInitialized(true);
      console.log('✅ Lit Protocol initialized');
    } catch (err) {
      console.error('Failed to initialize Lit Protocol:', err);
      setError(err.message);
    } finally {
      setIsInitializing(false);
    }
  };

  // Encrypt data for current user only
  const encryptForSelf = useCallback(
    async (data) => {
      if (!address) throw new Error('Wallet not connected');
      
      const accessConditions = createAccessControlConditions(address);
      const isString = typeof data === 'string';
      
      return isString
        ? await encryptString(data, accessConditions)
        : await encryptJSON(data, accessConditions);
    },
    [address]
  );

  // Encrypt data for two parties (e.g., lender and borrower)
  const encryptForTwo = useCallback(
    async (data, otherAddress) => {
      if (!address) throw new Error('Wallet not connected');
      
      const accessConditions = createMultiPartyAccessControl(address, otherAddress);
      const isString = typeof data === 'string';
      
      return isString
        ? await encryptString(data, accessConditions)
        : await encryptJSON(data, accessConditions);
    },
    [address]
  );

  // Decrypt data
  const decrypt = useCallback(async (encryptedData) => {
    const hasStringContent = typeof encryptedData.ciphertext === 'string';
    
    try {
      return hasStringContent
        ? await decryptString(encryptedData)
        : await decryptJSON(encryptedData);
    } catch (err) {
      console.error('Decryption failed:', err);
      throw new Error('Failed to decrypt: ' + err.message);
    }
  }, []);

  // Check if user has access to encrypted content
  const verifyAccess = useCallback(async (accessControlConditions) => {
    try {
      return await checkAccess(accessControlConditions);
    } catch (err) {
      console.error('Access verification failed:', err);
      return false;
    }
  }, []);

  return {
    isInitialized,
    isInitializing,
    error,
    address,
    encryptForSelf,
    encryptForTwo,
    decrypt,
    verifyAccess,
    initialize,
  };
}

export default useLit;
