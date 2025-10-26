import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { ref, set, push, get } from 'firebase/database';
import { database } from '../config/firebase';
import '../styles/Payroll.css';

const Payroll = ({ contract, address }) => {
  const [recipients, setRecipients] = useState([
    { wallet: '', amount: '', name: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [savedBatches, setSavedBatches] = useState([]);
  const [batchName, setBatchName] = useState('');
  const [showSavedBatches, setShowSavedBatches] = useState(false);

  // Load saved batches on mount
  const loadSavedBatches = useCallback(async () => {
    if (!address) return;
    
    try {
      const batchesRef = ref(database, `payrollBatches/${address}`);
      const snapshot = await get(batchesRef);
      
      if (snapshot.exists()) {
        const batches = [];
        snapshot.forEach((child) => {
          batches.push({
            id: child.key,
            ...child.val()
          });
        });
        setSavedBatches(batches);
      }
    } catch (error) {
      console.error('Error loading saved batches:', error);
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      loadSavedBatches();
    }
  }, [address, loadSavedBatches]);

  // Save current batch to Firebase
  const handleSaveBatch = async () => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    const validRecipients = recipients.filter(r => 
      r.wallet && r.amount && parseFloat(r.amount) > 0
    );

    if (validRecipients.length === 0) {
      alert('Please add at least one valid recipient before saving');
      return;
    }

    const name = batchName.trim() || `Batch ${new Date().toLocaleDateString()}`;
    
    try {
      const batchData = {
        name,
        recipients: validRecipients,
        totalAmount: getTotalAmount(),
        createdAt: Date.now(),
        lastModified: Date.now()
      };

      const batchesRef = ref(database, `payrollBatches/${address}`);
      const newBatchRef = push(batchesRef);
      await set(newBatchRef, batchData);

      alert(`✅ Batch "${name}" saved successfully!`);
      setBatchName('');
      await loadSavedBatches();
    } catch (error) {
      console.error('Error saving batch:', error);
      alert('Failed to save batch: ' + error.message);
    }
  };

  // Load a saved batch
  const handleLoadBatch = (batch) => {
    setRecipients(batch.recipients);
    setShowSavedBatches(false);
    alert(`✅ Loaded batch "${batch.name}"`);
  };

  // Delete a saved batch
  const handleDeleteBatch = async (batchId) => {
    if (!confirm('Are you sure you want to delete this batch?')) return;

    try {
      const batchRef = ref(database, `payrollBatches/${address}/${batchId}`);
      await set(batchRef, null);
      alert('✅ Batch deleted successfully!');
      await loadSavedBatches();
    } catch (error) {
      console.error('Error deleting batch:', error);
      alert('Failed to delete batch: ' + error.message);
    }
  };

  // Add recipient
  const addRecipient = () => {
    setRecipients([...recipients, { wallet: '', amount: '', name: '' }]);
  };

  // Remove recipient
  const removeRecipient = (index) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index));
    }
  };

  // Update recipient data
  const updateRecipient = (index, field, value) => {
    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);
  };

  // Calculate total amount
  const getTotalAmount = () => {
    return recipients.reduce((sum, r) => {
      const amount = parseFloat(r.amount) || 0;
      return sum + amount;
    }, 0);
  };

  // Execute payment to all recipients
  const handleExecutePayment = async () => {
    if (!contract || !address) {
      alert('Please connect your wallet first');
      return;
    }

    // Validate all recipients
    const validRecipients = recipients.filter(r => 
      r.wallet && r.amount && parseFloat(r.amount) > 0
    );

    if (validRecipients.length === 0) {
      alert('Please add at least one recipient with a valid wallet address and amount');
      return;
    }

    // Validate wallet addresses
    for (const recipient of validRecipients) {
      if (!ethers.isAddress(recipient.wallet)) {
        alert(`Invalid wallet address: ${recipient.wallet}`);
        return;
      }
    }

    const totalAmount = getTotalAmount();
    
    try {
      setLoading(true);
      setTxHash('');

      // Check vault balance
      const vaultBalance = await contract.balanceOf(address);
      const vaultBalanceEth = parseFloat(ethers.formatEther(vaultBalance));

      if (vaultBalanceEth < totalAmount) {
        alert(
          `Insufficient vault balance!\n\n` +
          `Required: ${totalAmount.toFixed(4)} ETH\n` +
          `Available: ${vaultBalanceEth.toFixed(4)} ETH\n\n` +
          `Please deposit more funds to your vault first.`
        );
        setLoading(false);
        return;
      }

      // Execute payments one by one with delays
      let successCount = 0;
      for (const recipient of validRecipients) {
        try {
          const amount = ethers.parseEther(recipient.amount);
          const ref = ethers.hexlify(ethers.randomBytes(32));
          
          console.log(`Paying ${recipient.amount} ETH to ${recipient.wallet}`);
          const tx = await contract.pay(recipient.wallet, amount, ref);
          
          console.log('Transaction sent:', tx.hash);
          await tx.wait();
          
          console.log(`✅ Paid ${recipient.amount} ETH to ${recipient.wallet}`);
          successCount++;
          setTxHash(tx.hash);
          
          // Wait 10 seconds between payments to avoid issues
          if (successCount < validRecipients.length) {
            console.log('⏳ Waiting 10 seconds before next payment...');
            await new Promise(resolve => setTimeout(resolve, 10000));
          }
        } catch (error) {
          console.error(`Failed to pay ${recipient.wallet}:`, error);
          alert(`Payment to ${recipient.name || recipient.wallet} failed: ${error.message}`);
          break;
        }
      }

      if (successCount === validRecipients.length) {
        alert(`✅ Successfully paid all ${successCount} recipients!`);
        // Reset form
        setRecipients([{ wallet: '', amount: '', name: '' }]);
      }

    } catch (error) {
      console.error('Error executing payments:', error);
      let errorMessage = 'Failed to execute payments. ';
      
      if (error.message?.includes('insufficient funds')) {
        errorMessage += 'Insufficient funds in wallet for gas fees.';
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction cancelled by user.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Import recipients from CSV
  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        // Skip header if exists
        const startIndex = lines[0].toLowerCase().includes('wallet') ? 1 : 0;
        
        const imported = lines.slice(startIndex).map(line => {
          const [wallet, amount, name] = line.split(',').map(s => s.trim());
          return { wallet, amount, name: name || '' };
        }).filter(r => r.wallet && r.amount);

        if (imported.length > 0) {
          setRecipients(imported);
          alert(`✅ Imported ${imported.length} recipients`);
        }
      } catch {
        alert('Failed to parse CSV file. Please use format: wallet,amount,name');
      }
    };
    reader.readAsText(file);
  };

  if (!address) {
    return (
      <div className="payroll-container">
        <div className="connect-wallet-notice">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="7" width="18" height="13" rx="2" />
            <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <circle cx="12" cy="13" r="1" />
          </svg>
          <h3>Connect Your Wallet</h3>
          <p>Please connect your wallet to access the payroll feature</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payroll-container">
      <div className="payroll-header">
        <h2>Multi-Recipient Payment</h2>
        <p className="payroll-subtitle">Send ETH to multiple recipients in one transaction batch</p>
      </div>

      <div className="payroll-content">
        <div className="recipients-section">
          <div className="section-header">
            <h3>Recipients ({recipients.length})</h3>
            <div className="header-actions">
              <button 
                className="view-batches-btn"
                onClick={() => setShowSavedBatches(!showSavedBatches)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Saved Batches ({savedBatches.length})
              </button>
              <label className="import-btn">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  style={{ display: 'none' }}
                />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Import CSV
              </label>
              <button className="add-recipient-btn" onClick={addRecipient}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Recipient
              </button>
            </div>
          </div>

          {showSavedBatches && (
            <div className="saved-batches-section">
              <h4>Saved Batches</h4>
              {savedBatches.length === 0 ? (
                <p className="no-batches">No saved batches yet. Save your current recipients to reuse them later!</p>
              ) : (
                <div className="saved-batches-list">
                  {savedBatches.map((batch) => (
                    <div key={batch.id} className="saved-batch-card">
                      <div className="batch-info">
                        <h5>{batch.name}</h5>
                        <p>{batch.recipients.length} recipients • {batch.totalAmount.toFixed(4)} ETH total</p>
                        <small>Saved: {new Date(batch.createdAt).toLocaleDateString()}</small>
                      </div>
                      <div className="batch-actions">
                        <button onClick={() => handleLoadBatch(batch)} className="load-btn">
                          Load
                        </button>
                        <button onClick={() => handleDeleteBatch(batch.id)} className="delete-btn">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="recipients-list">
            {recipients.map((recipient, index) => (
              <div key={index} className="recipient-card">
                <div className="recipient-number">#{index + 1}</div>
                <div className="recipient-fields">
                  <div className="field-group">
                    <label>Wallet Address</label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={recipient.wallet}
                      onChange={(e) => updateRecipient(index, 'wallet', e.target.value)}
                    />
                  </div>
                  <div className="field-row">
                    <div className="field-group">
                      <label>Amount (ETH)</label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder="0.0"
                        value={recipient.amount}
                        onChange={(e) => updateRecipient(index, 'amount', e.target.value)}
                      />
                    </div>
                    <div className="field-group">
                      <label>Name (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g., John Doe"
                        value={recipient.name}
                        onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                {recipients.length > 1 && (
                  <button
                    className="remove-recipient-btn"
                    onClick={() => removeRecipient(index)}
                    title="Remove recipient"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="payment-summary">
          <div className="summary-card">
            <h3>Payment Summary</h3>
            <div className="summary-row">
              <span>Total Recipients:</span>
              <span className="summary-value">{recipients.filter(r => r.wallet && r.amount).length}</span>
            </div>
            <div className="summary-row total">
              <span>Total Amount:</span>
              <span className="summary-value">{getTotalAmount().toFixed(4)} ETH</span>
            </div>

            <div className="save-batch-section">
              <input
                type="text"
                placeholder="Batch name (optional)"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                className="batch-name-input"
              />
              <button
                className="save-batch-btn"
                onClick={handleSaveBatch}
                disabled={recipients.filter(r => r.wallet && r.amount).length === 0}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Save Batch
              </button>
            </div>
            
            <button
              className="execute-payment-btn"
              onClick={handleExecutePayment}
              disabled={loading || recipients.filter(r => r.wallet && r.amount).length === 0}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Processing...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Execute Payments
                </>
              )}
            </button>

            {txHash && (
              <div className="tx-success">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Payments executed successfully!</span>
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view-tx-link"
                >
                  View on Etherscan
                </a>
              </div>
            )}
          </div>

          <div className="csv-format-info">
            <h4>CSV Import Format</h4>
            <code>
              wallet,amount,name<br/>
              0x123...,0.5,Alice<br/>
              0x456...,1.0,Bob
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payroll;
