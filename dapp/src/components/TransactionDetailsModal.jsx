import React, { useState, useEffect } from 'react';
import { 
  getTransactionDetails, 
  buildExplorerLink,
  formatTransactionValue,
  formatTimestamp,
  getTransactionStatus
} from '../utils/blockscout';
import '../styles/TransactionDetailsModal.css';

export default function TransactionDetailsModal({ txHash, chainId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [txData, setTxData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTransactionDetails = async () => {
      if (!txHash) return;
      
      setLoading(true);
      setError(null);
      
      const result = await getTransactionDetails(txHash, chainId);
      
      if (result.success) {
        setTxData(result.data);
      } else {
        setError(result.error);
      }
      
      setLoading(false);
    };

    loadTransactionDetails();
  }, [txHash, chainId]);

  if (!txHash) return null;

  const explorerLink = buildExplorerLink('tx', txHash, chainId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="tx-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📊 Transaction Details</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading transaction details from Blockscout...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p>⚠️ Error loading transaction details: {error}</p>
              <a 
                href={explorerLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="explorer-link"
              >
                View on Blockscout Explorer →
              </a>
            </div>
          )}

          {!loading && !error && txData && (
            <div className="tx-details-content">
              {/* Status Badge */}
              <div className="status-section">
                <StatusBadge tx={txData} />
              </div>

              {/* Transaction Hash */}
              <div className="detail-row">
                <span className="label">Transaction Hash:</span>
                <span className="value hash-value">
                  {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  <button 
                    className="copy-btn"
                    onClick={() => navigator.clipboard.writeText(txHash)}
                  >
                    📋
                  </button>
                </span>
              </div>

              {/* Block Number */}
              {txData.block && (
                <div className="detail-row">
                  <span className="label">Block:</span>
                  <span className="value">
                    <a 
                      href={buildExplorerLink('block', txData.block, chainId)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {txData.block}
                    </a>
                  </span>
                </div>
              )}

              {/* Timestamp */}
              {txData.timestamp && (
                <div className="detail-row">
                  <span className="label">Timestamp:</span>
                  <span className="value">{formatTimestamp(txData.timestamp)}</span>
                </div>
              )}

              {/* From Address */}
              {txData.from && (
                <div className="detail-row">
                  <span className="label">From:</span>
                  <span className="value hash-value">
                    <a 
                      href={buildExplorerLink('address', txData.from.hash, chainId)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {txData.from.hash.slice(0, 10)}...{txData.from.hash.slice(-8)}
                    </a>
                    {txData.from.name && <span className="address-name">{txData.from.name}</span>}
                  </span>
                </div>
              )}

              {/* To Address */}
              {txData.to && (
                <div className="detail-row">
                  <span className="label">To:</span>
                  <span className="value hash-value">
                    <a 
                      href={buildExplorerLink('address', txData.to.hash, chainId)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {txData.to.hash.slice(0, 10)}...{txData.to.hash.slice(-8)}
                    </a>
                    {txData.to.name && <span className="address-name">{txData.to.name}</span>}
                  </span>
                </div>
              )}

              {/* Value */}
              {txData.value && (
                <div className="detail-row">
                  <span className="label">Value:</span>
                  <span className="value amount-value">
                    {formatTransactionValue(txData.value)} ETH
                  </span>
                </div>
              )}

              {/* Gas Used */}
              {txData.gas_used && (
                <div className="detail-row">
                  <span className="label">Gas Used:</span>
                  <span className="value">{txData.gas_used.toLocaleString()}</span>
                </div>
              )}

              {/* Gas Price */}
              {txData.gas_price && (
                <div className="detail-row">
                  <span className="label">Gas Price:</span>
                  <span className="value">
                    {formatTransactionValue(txData.gas_price, 9)} Gwei
                  </span>
                </div>
              )}

              {/* Transaction Fee */}
              {txData.fee && (
                <div className="detail-row">
                  <span className="label">Transaction Fee:</span>
                  <span className="value">
                    {formatTransactionValue(txData.fee.value)} ETH
                  </span>
                </div>
              )}

              {/* Confirmations */}
              {txData.confirmations && (
                <div className="detail-row">
                  <span className="label">Confirmations:</span>
                  <span className="value">{txData.confirmations.toLocaleString()}</span>
                </div>
              )}

              {/* Method */}
              {txData.method && (
                <div className="detail-row">
                  <span className="label">Method:</span>
                  <span className="value method-badge">{txData.method}</span>
                </div>
              )}

              {/* View on Blockscout */}
              <div className="explorer-link-section">
                <a 
                  href={explorerLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="view-explorer-btn"
                >
                  🔍 View Full Details on Blockscout
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="close-modal-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ tx }) {
  const status = getTransactionStatus(tx);
  
  return (
    <div className={`status-badge status-${status.color}`}>
      {status.color === 'green' && '✅'}
      {status.color === 'red' && '❌'}
      {status.color === 'yellow' && '⏳'}
      {status.color === 'gray' && '❓'}
      {status.text}
    </div>
  );
}
