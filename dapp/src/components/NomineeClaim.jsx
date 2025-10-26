/**
 * React Component: Nominee Claim
 * 
 * Allows nominees to claim their share after user inactivity
 */

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import NomineeVaultABI from '../contracts/NomineeVault.json';
import {
  initLitClient,
  claimNomineeShare,
  checkInactivityStatus,
  getEncryptedDataFromChain,
} from '../lib/litProtocol';

const NOMINEE_VAULT_ADDRESS = '0x4Bb25877b98782B0c15CE79119c37a7ea84A986f';

export default function NomineeClaim() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [signer, setSigner] = useState(null);
  const [litClient, setLitClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  
  // User to check
  const [userAddress, setUserAddress] = useState('');
  const [inactivityStatus, setInactivityStatus] = useState(null);
  const [decryptedData, setDecryptedData] = useState(null);
  const [nomineeIndex, setNomineeIndex] = useState(0);
  
  // Initialize
  useEffect(() => {
    async function init() {
      try {
        if (window.ethereum) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          await provider.send('eth_requestAccounts', []);
          const signer = provider.getSigner();
          const address = await signer.getAddress();
          
          setAccount(address);
          setSigner(signer);
          
          const vaultContract = new ethers.Contract(
            NOMINEE_VAULT_ADDRESS,
            NomineeVaultABI.abi,
            signer
          );
          setContract(vaultContract);
          
          const lit = await initLitClient();
          setLitClient(lit);
          
          setStatus('✅ Connected');
        }
      } catch (error) {
        setStatus(`❌ Error: ${error.message}`);
      }
    }
    
    init();
  }, []);
  
  // Check inactivity status
  const handleCheckInactivity = async () => {
    try {
      setLoading(true);
      setStatus('🔍 Checking inactivity status...');
      
      if (!ethers.utils.isAddress(userAddress)) {
        throw new Error('Invalid address');
      }
      
      const status = await checkInactivityStatus(userAddress, contract);
      setInactivityStatus(status);
      
      if (status.isInactive) {
        setStatus('✅ User is inactive - decryption available');
      } else {
        const days = Math.floor(status.timeUntilInactive / 86400);
        const hours = Math.floor((status.timeUntilInactive % 86400) / 3600);
        setStatus(`⏳ User will be inactive in ${days} days, ${hours} hours`);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Decrypt nominee data
  const handleDecryptData = async () => {
    try {
      setLoading(true);
      setStatus('🔓 Decrypting nominee data...');
      
      // Get metadata from local storage (in production, use secure backend)
      const metadataStr = localStorage.getItem(`nominee_metadata_${userAddress}`);
      if (!metadataStr) {
        throw new Error('No encryption metadata found. Nominee data may not be set up.');
      }
      
      const metadata = JSON.parse(metadataStr);
      
      // Decrypt using Lit Protocol
      const data = await decryptNomineeData({
        ciphertext: metadata.ciphertext,
        dataToEncryptHash: metadata.dataToEncryptHash,
        accessControlConditions: metadata.accessControlConditions,
        userAddress: userAddress,
        litClient,
      });
      
      setDecryptedData(data);
      setStatus('✅ Data decrypted successfully');
    } catch (error) {
      setStatus(`❌ Decryption error: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  // Claim share
  const handleClaim = async () => {
    try {
      setLoading(true);
      setStatus('💰 Claiming share...');
      
      const metadataStr = localStorage.getItem(`nominee_metadata_${userAddress}`);
      if (!metadataStr) {
        throw new Error('No encryption metadata found');
      }
      
      const metadata = JSON.parse(metadataStr);
      
      const { receipt, claimAmount, sharePercentage } = await claimNomineeShare({
        inactiveUserAddress: userAddress,
        nomineeIndex: nomineeIndex,
        metadata,
        contract,
        signer,
        litClient,
      });
      
      setStatus(
        `✅ Claimed ${claimAmount} ETH (${sharePercentage}%)! Tx: ${receipt.transactionHash}`
      );
    } catch (error) {
      setStatus(`❌ Claim error: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="nominee-claim">
      <h2>💰 Claim Nominee Share</h2>
      
      <div className="account-info">
        <p><strong>Your Address:</strong> {account || 'Not connected'}</p>
      </div>
      
      <div className="status-message">
        {status && <p>{status}</p>}
      </div>
      
      <div className="claim-form">
        <h3>Step 1: Check User Inactivity</h3>
        <input
          type="text"
          placeholder="Inactive User Address (0x...)"
          value={userAddress}
          onChange={(e) => setUserAddress(e.target.value)}
          style={{ width: '400px', marginRight: '10px' }}
        />
        <button onClick={handleCheckInactivity} disabled={loading || !contract}>
          🔍 Check Status
        </button>
        
        {inactivityStatus && (
          <div className="inactivity-info" style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
            <p><strong>Status:</strong> {inactivityStatus.isInactive ? '🔴 Inactive' : '🟢 Active'}</p>
            {!inactivityStatus.isInactive && (
              <p><strong>Time Until Inactive:</strong> {Math.floor(inactivityStatus.timeUntilInactive / 86400)} days</p>
            )}
            {inactivityStatus.isInactive && inactivityStatus.inactiveSince && (
              <p><strong>Inactive Since:</strong> {inactivityStatus.inactiveSince.toLocaleString()}</p>
            )}
          </div>
        )}
        
        <h3 style={{ marginTop: '30px' }}>Step 2: Decrypt Nominee Data</h3>
        <button
          onClick={handleDecryptData}
          disabled={loading || !inactivityStatus?.isInactive || !litClient}
        >
          🔓 Decrypt with Lit Protocol
        </button>
        
        {decryptedData && (
          <div className="decrypted-info" style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '5px' }}>
            <h4>Decrypted Nominees:</h4>
            {decryptedData.nominees.map((nominee, idx) => (
              <div key={idx} style={{ marginBottom: '10px' }}>
                <p>
                  <strong>Nominee {idx}:</strong> {nominee}
                  <br />
                  <strong>Share:</strong> {decryptedData.shares[idx]}%
                  {nominee.toLowerCase() === account.toLowerCase() && (
                    <span style={{ color: 'green', fontWeight: 'bold' }}> ← You!</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
        
        <h3 style={{ marginTop: '30px' }}>Step 3: Claim Your Share</h3>
        <div>
          <label>
            Your Nominee Index:{' '}
            <select
              value={nomineeIndex}
              onChange={(e) => setNomineeIndex(parseInt(e.target.value))}
              disabled={!decryptedData}
            >
              {decryptedData?.nominees.map((nominee, idx) => (
                <option key={idx} value={idx}>
                  {idx} - {nominee.substring(0, 10)}... ({decryptedData.shares[idx]}%)
                </option>
              ))}
            </select>
          </label>
        </div>
        
        <button
          onClick={handleClaim}
          disabled={loading || !decryptedData || !inactivityStatus?.isInactive}
          style={{
            marginTop: '15px',
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: decryptedData ? '#4CAF50' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: decryptedData ? 'pointer' : 'not-allowed',
          }}
        >
          {loading ? 'Processing...' : '💰 Claim Share'}
        </button>
      </div>
    </div>
  );
}
