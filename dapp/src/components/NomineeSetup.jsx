/**
 * React Component: Nominee Setup
 * 
 * Allows users to configure nominees with encrypted data via Lit Protocol
 */

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import NomineeVaultABI from '../contracts/NomineeVault.json'; // Import your ABI
import {
  initLitClient,
  setupNominees,
  checkInactivityStatus,
} from '../lib/litProtocol';

const NOMINEE_VAULT_ADDRESS = '0x4Bb25877b98782B0c15CE79119c37a7ea84A986f';

export default function NomineeSetup() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [signer, setSigner] = useState(null);
  const [litClient, setLitClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  
  // Nominee form state
  const [nominees, setNominees] = useState([
    { address: '', share: 0 },
  ]);
  
  // Initialize Web3 and Lit Protocol
  useEffect(() => {
    async function init() {
      try {
        // Connect to MetaMask
        if (window.ethereum) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          await provider.send('eth_requestAccounts', []);
          const signer = provider.getSigner();
          const address = await signer.getAddress();
          
          setAccount(address);
          setSigner(signer);
          
          // Initialize contract
          const vaultContract = new ethers.Contract(
            NOMINEE_VAULT_ADDRESS,
            NomineeVaultABI.abi,
            signer
          );
          setContract(vaultContract);
          
          // Initialize Lit Protocol
          const lit = await initLitClient();
          setLitClient(lit);
          
          setStatus('✅ Connected to wallet and Lit Protocol');
        } else {
          setStatus('❌ Please install MetaMask');
        }
      } catch (error) {
        console.error('Initialization error:', error);
        setStatus(`❌ Error: ${error.message}`);
      }
    }
    
    init();
  }, []);
  
  // Add nominee field
  const addNominee = () => {
    setNominees([...nominees, { address: '', share: 0 }]);
  };
  
  // Remove nominee field
  const removeNominee = (index) => {
    setNominees(nominees.filter((_, i) => i !== index));
  };
  
  // Update nominee address
  const updateNomineeAddress = (index, address) => {
    const updated = [...nominees];
    updated[index].address = address;
    setNominees(updated);
  };
  
  // Update nominee share
  const updateNomineeShare = (index, share) => {
    const updated = [...nominees];
    updated[index].share = parseInt(share) || 0;
    setNominees(updated);
  };
  
  // Calculate total shares
  const totalShares = nominees.reduce((sum, n) => sum + n.share, 0);
  
  // Handle nominee setup
  const handleSetupNominees = async () => {
    try {
      setLoading(true);
      setStatus('🔐 Setting up nominees...');
      
      // Validate
      if (totalShares !== 100) {
        throw new Error(`Shares must sum to 100%, currently: ${totalShares}%`);
      }
      
      const nomineeAddresses = nominees.map((n) => n.address);
      const shares = nominees.map((n) => n.share);
      
      // Validate addresses
      for (const addr of nomineeAddresses) {
        if (!ethers.utils.isAddress(addr)) {
          throw new Error(`Invalid address: ${addr}`);
        }
      }
      
      // Setup nominees with encryption
      const { receipt, metadata } = await setupNominees({
        nomineeAddresses,
        shares,
        contract,
        signer,
        litClient,
      });
      
      // Store metadata in local storage (in production, use secure backend)
      localStorage.setItem(
        `nominee_metadata_${account}`,
        JSON.stringify(metadata)
      );
      
      setStatus(`✅ Nominees set successfully! Tx: ${receipt.transactionHash}`);
    } catch (error) {
      console.error('Setup error:', error);
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Check user balance
  const [balance, setBalance] = useState('0');
  const checkBalance = async () => {
    if (contract && account) {
      const bal = await contract.balanceOf(account);
      setBalance(ethers.utils.formatEther(bal));
    }
  };
  
  useEffect(() => {
    checkBalance();
  }, [contract, account]);
  
  return (
    <div className="nominee-setup">
      <h2>🔐 Setup Nominees (Encrypted with Lit Protocol)</h2>
      
      <div className="account-info">
        <p><strong>Connected Account:</strong> {account || 'Not connected'}</p>
        <p><strong>Vault Balance:</strong> {balance} ETH</p>
      </div>
      
      <div className="status-message">
        {status && <p>{status}</p>}
      </div>
      
      <div className="nominees-form">
        <h3>Configure Nominees</h3>
        
        {nominees.map((nominee, index) => (
          <div key={index} className="nominee-row">
            <input
              type="text"
              placeholder="Nominee Address (0x...)"
              value={nominee.address}
              onChange={(e) => updateNomineeAddress(index, e.target.value)}
              style={{ width: '400px', marginRight: '10px' }}
            />
            <input
              type="number"
              placeholder="Share %"
              value={nominee.share || ''}
              onChange={(e) => updateNomineeShare(index, e.target.value)}
              min="0"
              max="100"
              style={{ width: '80px', marginRight: '10px' }}
            />
            <button onClick={() => removeNominee(index)} disabled={nominees.length === 1}>
              Remove
            </button>
          </div>
        ))}
        
        <div className="nominee-actions">
          <button onClick={addNominee}>+ Add Nominee</button>
          <p>
            <strong>Total Shares:</strong> {totalShares}% 
            {totalShares !== 100 && <span style={{ color: 'red' }}> (Must be 100%)</span>}
          </p>
        </div>
        
        <button
          onClick={handleSetupNominees}
          disabled={loading || totalShares !== 100 || !litClient}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: totalShares === 100 ? '#4CAF50' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: totalShares === 100 ? 'pointer' : 'not-allowed',
          }}
        >
          {loading ? 'Processing...' : '🔐 Encrypt & Set Nominees'}
        </button>
      </div>
      
      <div className="info-box" style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h4>ℹ️ How it works:</h4>
        <ul>
          <li>Your nominee data will be encrypted using Lit Protocol</li>
          <li>Only accessible after {Math.floor((31536000) / 86400)} days of inactivity</li>
          <li>Nominees can claim their shares proportionally</li>
          <li>You can update or remove nominees anytime while active</li>
        </ul>
      </div>
    </div>
  );
}
