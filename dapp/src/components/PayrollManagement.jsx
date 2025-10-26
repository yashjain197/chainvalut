import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import '../styles/PayrollManagement.css';

const PayrollManagement = ({ contract, address }) => {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newRecipient, setNewRecipient] = useState({
    wallet: '',
    amount: '',
    name: ''
  });

  // Load payroll recipients
  const loadRecipients = useCallback(async () => {
    if (!contract || !address) return;
    
    try {
      const payrollData = await contract.getPayrollRecipients();
      setRecipients(payrollData);
    } catch (error) {
      console.error('Error loading payroll recipients:', error);
    }
  }, [contract, address]);

  useEffect(() => {
    loadRecipients();
  }, [loadRecipients]);

  const handleAddRecipient = async () => {
    if (!newRecipient.wallet || !newRecipient.amount || !newRecipient.name) {
      alert('Please fill all fields');
      return;
    }

    if (!ethers.isAddress(newRecipient.wallet)) {
      alert('Invalid wallet address');
      return;
    }

    setLoading(true);
    try {
      const amount = ethers.parseEther(newRecipient.amount);
      const tx = await contract.addPayrollRecipient(
        newRecipient.wallet,
        amount,
        newRecipient.name
      );
      await tx.wait();
      
      alert('✅ Payroll recipient added successfully!');
      setNewRecipient({ wallet: '', amount: '', name: '' });
      await loadRecipients();
    } catch (error) {
      console.error('Error adding recipient:', error);
      alert('Failed to add recipient: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRecipient = async (wallet) => {
    if (!confirm(`Remove ${wallet} from payroll?`)) return;

    setLoading(true);
    try {
      const tx = await contract.removePayrollRecipient(wallet);
      await tx.wait();
      
      alert('✅ Recipient removed successfully!');
      await loadRecipients();
    } catch (error) {
      console.error('Error removing recipient:', error);
      alert('Failed to remove recipient: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayAll = async () => {
    if (recipients.length === 0) {
      alert('No payroll recipients configured');
      return;
    }

    const totalAmount = recipients.reduce((sum, r) => sum + parseFloat(ethers.formatEther(r.amount)), 0);
    
    if (!confirm(`Pay all ${recipients.length} recipients (Total: ${totalAmount.toFixed(4)} ETH)?`)) return;

    setLoading(true);
    try {
      const ref = ethers.hexlify(ethers.randomBytes(32));
      const tx = await contract.payAllPayroll(ref);
      await tx.wait();
      
      alert(`✅ Paid ${recipients.length} recipients successfully!`);
    } catch (error) {
      console.error('Error paying payroll:', error);
      alert('Failed to pay payroll: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return recipients.reduce((sum, r) => sum + parseFloat(ethers.formatEther(r.amount || 0)), 0);
  };

  return (
    <div className="payroll-management">
      <div className="payroll-header">
        <h2>💼 Payroll Management</h2>
        <p className="payroll-description">
          Set up recurring payments to team members or contractors
        </p>
      </div>

      {/* Add Recipient Form */}
      <div className="add-recipient-section">
        <h3>Add New Recipient</h3>
        <div className="recipient-form">
          <input
            type="text"
            placeholder="Wallet Address (0x...)"
            value={newRecipient.wallet}
            onChange={(e) => setNewRecipient({ ...newRecipient, wallet: e.target.value })}
            className="form-input"
          />
          <input
            type="number"
            step="0.001"
            placeholder="Amount (ETH)"
            value={newRecipient.amount}
            onChange={(e) => setNewRecipient({ ...newRecipient, amount: e.target.value })}
            className="form-input"
          />
          <input
            type="text"
            placeholder="Name/Label"
            value={newRecipient.name}
            onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
            className="form-input"
          />
          <button
            className="add-btn"
            onClick={handleAddRecipient}
            disabled={loading}
          >
            {loading ? 'Adding...' : '➕ Add Recipient'}
          </button>
        </div>
      </div>

      {/* Recipients List */}
      <div className="recipients-list">
        <div className="list-header">
          <h3>Payroll Recipients ({recipients.length})</h3>
          {recipients.length > 0 && (
            <div className="list-summary">
              <span className="total-label">Total Monthly:</span>
              <span className="total-amount">{calculateTotal().toFixed(4)} ETH</span>
            </div>
          )}
        </div>

        {recipients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>No payroll recipients yet</p>
            <p className="empty-hint">Add recipients above to start</p>
          </div>
        ) : (
          <div className="recipients-grid">
            {recipients.map((recipient, index) => (
              <div key={index} className="recipient-card">
                <div className="recipient-header">
                  <div className="recipient-avatar">
                    {recipient.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="recipient-info">
                    <h4>{recipient.name}</h4>
                    <p className="recipient-address">
                      {recipient.wallet.slice(0, 6)}...{recipient.wallet.slice(-4)}
                    </p>
                  </div>
                </div>
                <div className="recipient-amount">
                  <span className="amount-value">
                    {ethers.formatEther(recipient.amount)} ETH
                  </span>
                </div>
                <button
                  className="remove-btn"
                  onClick={() => handleRemoveRecipient(recipient.wallet)}
                  disabled={loading}
                >
                  ✕ Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pay All Button */}
      {recipients.length > 0 && (
        <div className="pay-all-section">
          <div className="pay-all-info">
            <p>
              💡 This will send payments to all {recipients.length} recipients from your vault balance
            </p>
          </div>
          <button
            className="pay-all-btn"
            onClick={handlePayAll}
            disabled={loading}
          >
            {loading ? 'Processing...' : `💰 Pay All Recipients (${calculateTotal().toFixed(4)} ETH)`}
          </button>
        </div>
      )}

      <div className="payroll-help">
        <h4>ℹ️ How Payroll Works:</h4>
        <ul>
          <li>Add recipients with their wallet address, amount, and name</li>
          <li>Click "Pay All Recipients" to send all payments at once</li>
          <li>Funds are sent directly from your vault balance</li>
          <li>You can remove or update recipients anytime</li>
          <li>All payments are recorded in transaction history</li>
        </ul>
      </div>
    </div>
  );
};

export default PayrollManagement;
