import React from 'react';
import { NETWORKS, switchNetwork } from '../utils/networks';
import '../styles/NetworkSwitcher.css';

const NetworkSwitcher = ({ currentNetwork, isWrongNetwork }) => {
  const [switching, setSwitching] = React.useState(false);

  const handleSwitchNetwork = async (network) => {
    try {
      setSwitching(true);
      await switchNetwork(network);
    } catch (err) {
      console.error('Error switching network:', err);
      alert(err.message || 'Failed to switch network');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="network-switcher">
      <div className="network-status">
        {currentNetwork ? (
          <div className={`network-badge ${isWrongNetwork ? 'wrong' : 'correct'}`}>
            <div className={`network-dot ${isWrongNetwork ? 'red' : 'green'}`}></div>
            <span>{currentNetwork.name}</span>
          </div>
        ) : (
          <div className="network-badge">
            <div className="network-dot gray"></div>
            <span>Not Connected</span>
          </div>
        )}
      </div>

      {isWrongNetwork && (
        <div className="network-warning">
          <p>⚠️ Please switch to a supported network</p>
        </div>
      )}

      <div className="network-buttons">
        <button
          className={`network-button ${currentNetwork?.chainIdDecimal === NETWORKS.MAINNET.chainIdDecimal ? 'active' : ''}`}
          onClick={() => handleSwitchNetwork(NETWORKS.MAINNET)}
          disabled={switching}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2"/>
            <circle cx="8" cy="8" r="3" fill="currentColor"/>
          </svg>
          Mainnet
        </button>
        
        <button
          className={`network-button ${currentNetwork?.chainIdDecimal === NETWORKS.SEPOLIA.chainIdDecimal ? 'active' : ''}`}
          onClick={() => handleSwitchNetwork(NETWORKS.SEPOLIA)}
          disabled={switching}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L3 6L8 9L13 6L8 1Z" fill="currentColor" opacity="0.6"/>
            <path d="M3 8L8 13L13 8L8 11L3 8Z" fill="currentColor"/>
          </svg>
          Sepolia
        </button>
      </div>
    </div>
  );
};

export default NetworkSwitcher;
