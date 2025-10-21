import React, { useState } from 'react';
import { ethers } from 'ethers';
import '../styles/ActionPanel.css';

const ActionPanel = ({ contract, onTransactionComplete }) => {
  const [activeTab, setActiveTab] = useState('deposit');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [payAddress, setPayAddress] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  const generateRef = () => {
    return ethers.hexlify(ethers.randomBytes(32));
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setTxHash('');

      const value = ethers.parseEther(depositAmount);
      const ref = generateRef();
      
      const tx = await contract.deposit(ref, { value });
      setTxHash(tx.hash);
      
      await tx.wait();
      
      setDepositAmount('');
      onTransactionComplete();
    } catch (err) {
      console.error('Deposit error:', err);
      setError(err.reason || err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!withdrawAddress || !ethers.isAddress(withdrawAddress)) {
      setError('Please enter a valid address');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setTxHash('');

      const amount = ethers.parseEther(withdrawAmount);
      const ref = generateRef();
      
      const tx = await contract.withdraw(amount, withdrawAddress, ref);
      setTxHash(tx.hash);
      
      await tx.wait();
      
      setWithdrawAmount('');
      setWithdrawAddress('');
      onTransactionComplete();
    } catch (err) {
      console.error('Withdraw error:', err);
      setError(err.reason || err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawAll = async () => {
    try {
      setLoading(true);
      setError('');
      setTxHash('');

      const ref = generateRef();
      const tx = await contract.withdrawAll(ref);
      setTxHash(tx.hash);
      
      await tx.wait();
      
      onTransactionComplete();
    } catch (err) {
      console.error('Withdraw all error:', err);
      setError(err.reason || err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!payAddress || !ethers.isAddress(payAddress)) {
      setError('Please enter a valid address');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setTxHash('');

      const amount = ethers.parseEther(payAmount);
      const ref = generateRef();
      
      const tx = await contract.pay(payAddress, amount, ref);
      setTxHash(tx.hash);
      
      await tx.wait();
      
      setPayAmount('');
      setPayAddress('');
      onTransactionComplete();
    } catch (err) {
      console.error('Pay error:', err);
      setError(err.reason || err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="action-panel">
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'deposit' ? 'active' : ''}`}
          onClick={() => setActiveTab('deposit')}
        >
          Deposit
        </button>
        <button 
          className={`tab ${activeTab === 'withdraw' ? 'active' : ''}`}
          onClick={() => setActiveTab('withdraw')}
        >
          Withdraw
        </button>
        <button 
          className={`tab ${activeTab === 'pay' ? 'active' : ''}`}
          onClick={() => setActiveTab('pay')}
        >
          Pay
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'deposit' && (
          <div className="action-form">
            <div className="form-group">
              <label>Amount (ETH)</label>
              <input
                type="number"
                step="0.001"
                placeholder="0.0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                disabled={loading}
              />
            </div>
            <button 
              className="action-button primary"
              onClick={handleDeposit}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Deposit ETH'}
            </button>
          </div>
        )}

        {activeTab === 'withdraw' && (
          <div className="action-form">
            <div className="form-group">
              <label>Amount (ETH)</label>
              <input
                type="number"
                step="0.001"
                placeholder="0.0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Recipient Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="button-group">
              <button 
                className="action-button primary"
                onClick={handleWithdraw}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Withdraw'}
              </button>
              <button 
                className="action-button secondary"
                onClick={handleWithdrawAll}
                disabled={loading}
              >
                Withdraw All
              </button>
            </div>
          </div>
        )}

        {activeTab === 'pay' && (
          <div className="action-form">
            <div className="form-group">
              <label>Recipient Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={payAddress}
                onChange={(e) => setPayAddress(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Amount (ETH)</label>
              <input
                type="number"
                step="0.001"
                placeholder="0.0"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                disabled={loading}
              />
            </div>
            <button 
              className="action-button primary"
              onClick={handlePay}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Send Payment'}
            </button>
          </div>
        )}

        {error && (
          <div className="message error">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 12H7V7h2v5zm0-6H7V4h2v2z" fill="currentColor"/>
            </svg>
            {error}
          </div>
        )}

        {txHash && (
          <div className="message success">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm-1 12L3 8l1.4-1.4L7 9.2l4.6-4.6L13 6l-6 6z" fill="currentColor"/>
            </svg>
            Transaction successful! 
            <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
              View on Etherscan
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionPanel;
