import React, { useState, useEffect } from 'react';
import { useChainId } from 'wagmi';
import { 
  getAddressTransactions,
  buildExplorerLink,
  formatTransactionValue,
  formatTimestamp
} from '../utils/blockscout';
import TransactionDetailsModal from './TransactionDetailsModal';
import '../styles/BlockscoutWidget.css';

export default function BlockscoutWidget({ address }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTxHash, setSelectedTxHash] = useState(null);
  const chainId = useChainId();

  useEffect(() => {
    const loadTransactions = async () => {
      if (!address) return;
      
      setLoading(true);
      const result = await getAddressTransactions(address, chainId);
      
      if (result.success) {
        setTransactions(result.transactions.slice(0, 5)); // Show latest 5
      }
      
      setLoading(false);
    };

    loadTransactions();
  }, [address, chainId]);

  if (!address) return null;

  const explorerLink = buildExplorerLink('address', address, chainId);

  return (
    <div className="blockscout-widget">
      <div className="widget-header">
        <h3>Recent Blockchain Activity</h3>
        <a 
          href={explorerLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="view-all-link"
        >
          View All on Blockscout →
        </a>
      </div>

      <div className="widget-body">
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading from Blockscout...</p>
          </div>
        )}

        {!loading && transactions.length === 0 && (
          <div className="empty-state">
            <p>No recent transactions found</p>
          </div>
        )}

        {!loading && transactions.length > 0 && (
          <div className="tx-list">
            {transactions.map((tx, index) => (
              <div key={index} className="tx-item">
                <div className="tx-icon">
                  {tx.from?.hash?.toLowerCase() === address.toLowerCase() ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 20l5-5h-3V8H8v7H5l5 5z" fill="#f44336"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 0L5 5h3v7h4V5h3L10 0z" fill="#4caf50"/>
                    </svg>
                  )}
                </div>

                <div className="tx-info">
                  <div className="tx-type">
                    {tx.method || 'Transfer'}
                    {tx.status === 'ok' && <span className="status-ok">✓</span>}
                    {tx.status === 'error' && <span className="status-error">✗</span>}
                  </div>
                  
                  <div className="tx-details-row">
                    <span className="tx-hash">
                      {tx.hash?.slice(0, 10)}...{tx.hash?.slice(-6)}
                    </span>
                    <span className="tx-time">
                      {formatTimestamp(tx.timestamp)}
                    </span>
                  </div>

                  <div className="tx-addresses">
                    {tx.from?.hash && (
                      <span className="address-label">
                        From: {tx.from.hash.slice(0, 8)}...
                      </span>
                    )}
                    {tx.to?.hash && (
                      <span className="address-label">
                        To: {tx.to.hash.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                </div>

                <div className="tx-amount">
                  {tx.value && parseFloat(tx.value) > 0 && (
                    <div className="amount-value">
                      {formatTransactionValue(tx.value)} ETH
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedTxHash(tx.hash)}
                    className="view-details-btn"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="powered-by">
          Powered by <a href="https://blockscout.com" target="_blank" rel="noopener noreferrer">Blockscout</a>
        </div>
      </div>

      {selectedTxHash && (
        <TransactionDetailsModal
          txHash={selectedTxHash}
          chainId={chainId}
          onClose={() => setSelectedTxHash(null)}
        />
      )}
    </div>
  );
}
