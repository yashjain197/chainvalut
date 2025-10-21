import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import '../styles/TransactionHistory.css';

const TransactionHistory = ({ contract, account }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const actionNames = ['Deposit', 'Withdraw', 'Pay'];

  useEffect(() => {
    const fetchHistory = async () => {
      if (!contract || !account) return;

      try {
        setLoading(true);
        const records = await contract.recentHistory(account);
        setHistory(records);
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [contract, account]);

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };

  const getActionClass = (action) => {
    const actionMap = {
      0: 'deposit',
      1: 'withdraw',
      2: 'pay'
    };
    return actionMap[action] || 'unknown';
  };

  if (loading) {
    return (
      <div className="transaction-history">
        <h2>Recent Transactions</h2>
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="transaction-history">
      <h2>Recent Transactions</h2>
      {history.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M24 4C12.96 4 4 12.96 4 24s8.96 20 20 20 20-8.96 20-20S35.04 4 24 4zm0 36c-8.84 0-16-7.16-16-16S15.16 8 24 8s16 7.16 16 16-7.16 16-16 16z" fill="currentColor" opacity="0.3"/>
            <path d="M22 30h4v4h-4v-4zm0-16h4v12h-4V14z" fill="currentColor" opacity="0.3"/>
          </svg>
          <p>No transactions yet</p>
        </div>
      ) : (
        <div className="transaction-list">
          {history.map((record, index) => (
            <div key={index} className={`transaction-item ${getActionClass(record.action)}`}>
              <div className="transaction-icon">
                {record.action === 0n && (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 0L5 5h3v7h4V5h3L10 0zM0 18h20v2H0v-2z" fill="currentColor"/>
                  </svg>
                )}
                {record.action === 1n && (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 20l5-5h-3V8H8v7H5l5 5zM0 0h20v2H0V0z" fill="currentColor"/>
                  </svg>
                )}
                {record.action === 2n && (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M20 8l-5-5v3H8v4h7v3l5-5zM0 18h12v2H0v-2z" fill="currentColor"/>
                  </svg>
                )}
              </div>
              
              <div className="transaction-details">
                <div className="transaction-type">
                  {actionNames[Number(record.action)]}
                </div>
                <div className="transaction-meta">
                  {record.action === 2n ? (
                    <>From {formatAddress(record.from)} → To {formatAddress(record.to)}</>
                  ) : record.action === 1n ? (
                    <>To {formatAddress(record.to)}</>
                  ) : (
                    <>From {formatAddress(record.from)}</>
                  )}
                </div>
                <div className="transaction-date">
                  {formatDate(record.timestamp)}
                </div>
              </div>

              <div className="transaction-amount">
                <div className="amount">
                  {record.action === 1n || record.action === 2n ? '-' : '+'}
                  {ethers.formatEther(record.amount)} ETH
                </div>
                <div className="balance-after">
                  Balance: {ethers.formatEther(record.balanceAfter)} ETH
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
