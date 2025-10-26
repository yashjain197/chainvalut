/**
 * Lit Protocol Integration
 * https://developer.litprotocol.com/
 * 
 * Features:
 * - Encrypt/Decrypt private data
 * - Access control based on on-chain conditions
 * - Secure message encryption for lending/borrowing
 * - Private payroll data encryption
 */

import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LitNetwork } from '@lit-protocol/constants';
import { 
  checkAndSignAuthMessage,
  encryptString as litEncryptString,
  decryptToString
} from '@lit-protocol/lit-node-client';

// Lit Protocol client instance
let litNodeClient = null;

/**
 * Initialize Lit Protocol client
 */
export async function initializeLit() {
  if (litNodeClient) return litNodeClient;

  try {
    console.log('🔐 Initializing Lit Protocol...');
    
    // Use string literal instead of enum if LitNetwork is undefined
    const network = LitNetwork?.DatilTest || 'datil-test';
    
    litNodeClient = new LitNodeClient({
      litNetwork: network,
      debug: false,
    });

    await litNodeClient.connect();
    console.log('✅ Lit Protocol connected');
    
    return litNodeClient;
  } catch (error) {
    console.error('❌ Error initializing Lit Protocol:', error);
    throw error;
  }
}

/**
 * Get or initialize Lit client
 */
export async function getLitClient() {
  if (!litNodeClient) {
    return await initializeLit();
  }
  return litNodeClient;
}

/**
 * Disconnect Lit Protocol client
 */
export function disconnectLit() {
  if (litNodeClient) {
    litNodeClient.disconnect();
    litNodeClient = null;
    console.log('Lit Protocol disconnected');
  }
}

/**
 * Create access control conditions for encryption
 * Example: Only the wallet address can decrypt
 */
export function createAccessControlConditions(address) {
  return [
    {
      contractAddress: '',
      standardContractType: '',
      chain: 'sepolia',
      method: '',
      parameters: [':userAddress'],
      returnValueTest: {
        comparator: '=',
        value: address.toLowerCase(),
      },
    },
  ];
}

/**
 * Create access control conditions for two parties
 * Example: Both lender and borrower can decrypt
 */
export function createMultiPartyAccessControl(address1, address2) {
  return [
    {
      contractAddress: '',
      standardContractType: '',
      chain: 'sepolia',
      method: '',
      parameters: [':userAddress'],
      returnValueTest: {
        comparator: '=',
        value: address1.toLowerCase(),
      },
    },
    { operator: 'or' },
    {
      contractAddress: '',
      standardContractType: '',
      chain: 'sepolia',
      method: '',
      parameters: [':userAddress'],
      returnValueTest: {
        comparator: '=',
        value: address2.toLowerCase(),
      },
    },
  ];
}

/**
 * Create access control based on token balance
 * Example: User must hold at least X tokens
 */
export function createTokenBalanceAccessControl(tokenAddress, minBalance, chain = 'sepolia') {
  return [
    {
      contractAddress: tokenAddress,
      standardContractType: 'ERC20',
      chain: chain,
      method: 'balanceOf',
      parameters: [':userAddress'],
      returnValueTest: {
        comparator: '>=',
        value: minBalance.toString(),
      },
    },
  ];
}

/**
 * Encrypt string data with Lit Protocol
 */
export async function encryptString(text, accessControlConditions, chain = 'sepolia') {
  try {
    const client = await getLitClient();

    await checkAndSignAuthMessage({ 
      chain,
      nonce: await client.getLatestBlockhash(),
    });

    const { ciphertext, dataToEncryptHash } = await litEncryptString(
      {
        accessControlConditions,
        dataToEncrypt: text,
      },
      client,
    );

    return {
      ciphertext,
      dataToEncryptHash,
      accessControlConditions,
      chain,
    };
  } catch (error) {
    console.error('Error encrypting with Lit:', error);
    throw error;
  }
}

/**
 * Decrypt string data with Lit Protocol
 */
export async function decryptString(encryptedData, chain = 'sepolia') {
  try {
    const client = await getLitClient();

    const authSig = await checkAndSignAuthMessage({ 
      chain,
      nonce: await client.getLatestBlockhash(),
    });

    const decryptedString = await decryptToString(
      {
        accessControlConditions: encryptedData.accessControlConditions,
        ciphertext: encryptedData.ciphertext,
        dataToEncryptHash: encryptedData.dataToEncryptHash,
        authSig,
        chain,
      },
      client,
    );

    return decryptedString;
  } catch (error) {
    console.error('Error decrypting with Lit:', error);
    throw error;
  }
}

/**
 * Encrypt JSON data
 */
export async function encryptJSON(data, accessControlConditions, chain = 'sepolia') {
  const jsonString = JSON.stringify(data);
  return await encryptString(jsonString, accessControlConditions, chain);
}

/**
 * Decrypt JSON data
 */
export async function decryptJSON(encryptedData, chain = 'sepolia') {
  const decryptedString = await decryptString(encryptedData, chain);
  return JSON.parse(decryptedString);
}

/**
 * Encrypt sensitive lending terms
 * Only lender and borrower can decrypt
 */
export async function encryptLendingTerms(terms, lenderAddress, borrowerAddress) {
  const accessConditions = createMultiPartyAccessControl(lenderAddress, borrowerAddress);
  return await encryptJSON(terms, accessConditions);
}

/**
 * Decrypt lending terms
 */
export async function decryptLendingTerms(encryptedTerms) {
  return await decryptJSON(encryptedTerms);
}

/**
 * Encrypt payroll data
 * Only the wallet owner can decrypt
 */
export async function encryptPayrollData(payrollData, ownerAddress) {
  const accessConditions = createAccessControlConditions(ownerAddress);
  return await encryptJSON(payrollData, accessConditions);
}

/**
 * Decrypt payroll data
 */
export async function decryptPayrollData(encryptedData) {
  return await decryptJSON(encryptedData);
}

/**
 * Encrypt private message in chat
 */
export async function encryptChatMessage(message, senderAddress, recipientAddress) {
  const accessConditions = createMultiPartyAccessControl(senderAddress, recipientAddress);
  return await encryptString(message, accessConditions);
}

/**
 * Decrypt private message in chat
 */
export async function decryptChatMessage(encryptedMessage) {
  return await decryptString(encryptedMessage);
}

/**
 * Create time-locked access control
 * Example: Can only decrypt after a specific timestamp
 */
export function createTimeLockedAccessControl(address, unlockTimestamp) {
  return [
    {
      contractAddress: '',
      standardContractType: '',
      chain: 'sepolia',
      method: '',
      parameters: [':userAddress'],
      returnValueTest: {
        comparator: '=',
        value: address.toLowerCase(),
      },
    },
    { operator: 'and' },
    {
      contractAddress: '',
      standardContractType: 'timestamp',
      chain: 'sepolia',
      method: '',
      parameters: [],
      returnValueTest: {
        comparator: '>=',
        value: unlockTimestamp.toString(),
      },
    },
  ];
}

/**
 * Get Lit Protocol session signatures
 */
export async function getLitSessionSigs() {
  try {
    const client = await getLitClient();
    
    const authSig = await checkAndSignAuthMessage({ 
      chain: 'sepolia',
      nonce: await client.getLatestBlockhash(),
    });

    return authSig;
  } catch (error) {
    console.error('Error getting Lit session signatures:', error);
    throw error;
  }
}

/**
 * Check if user has access to encrypted content
 */
export async function checkAccess(accessControlConditions) {
  try {
    const client = await getLitClient();
    
    const authSig = await checkAndSignAuthMessage({ 
      chain: 'sepolia',
      nonce: await client.getLatestBlockhash(),
    });

    // This will throw an error if user doesn't have access
    const hasAccess = await client.getSignedToken({
      accessControlConditions,
      authSig,
      chain: 'sepolia',
    });

    return !!hasAccess;
  } catch (error) {
    console.error('Access check failed:', error);
    return false;
  }
}

/**
 * Utility: Convert ciphertext to base64 for storage
 */
export function ciphertextToBase64(ciphertext) {
  // Convert to base64 using browser's btoa if available, or fallback
  try {
    return btoa(ciphertext);
  } catch {
    // Fallback for non-browser environments
    return ciphertext;
  }
}

/**
 * Utility: Convert base64 back to ciphertext
 */
export function base64ToCiphertext(base64) {
  // Convert from base64 using browser's atob if available, or fallback
  try {
    return atob(base64);
  } catch {
    // Fallback for non-browser environments
    return base64;
  }
}

/**
 * Store encrypted data in a format ready for Firebase
 */
export function prepareEncryptedDataForStorage(encryptedData) {
  return {
    ciphertext: ciphertextToBase64(encryptedData.ciphertext),
    dataToEncryptHash: encryptedData.dataToEncryptHash,
    accessControlConditions: encryptedData.accessControlConditions,
    chain: encryptedData.chain || 'sepolia',
    encrypted: true,
    encryptedAt: new Date().toISOString(),
  };
}

/**
 * Prepare encrypted data from Firebase for decryption
 */
export function prepareStoredDataForDecryption(storedData) {
  return {
    ciphertext: base64ToCiphertext(storedData.ciphertext),
    dataToEncryptHash: storedData.dataToEncryptHash,
    accessControlConditions: storedData.accessControlConditions,
    chain: storedData.chain || 'sepolia',
  };
}

export default {
  initializeLit,
  getLitClient,
  disconnectLit,
  encryptString,
  decryptString,
  encryptJSON,
  decryptJSON,
  encryptLendingTerms,
  decryptLendingTerms,
  encryptPayrollData,
  decryptPayrollData,
  encryptChatMessage,
  decryptChatMessage,
  createAccessControlConditions,
  createMultiPartyAccessControl,
  createTokenBalanceAccessControl,
  createTimeLockedAccessControl,
  checkAccess,
  getLitSessionSigs,
  prepareEncryptedDataForStorage,
  prepareStoredDataForDecryption,
};
