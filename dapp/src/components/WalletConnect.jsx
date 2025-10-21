import React from 'react';
import '../styles/WalletConnect.css';

const WalletConnect = ({ account, isConnecting, onConnect, onDisconnect }) => {
  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="wallet-connect">
      {!account ? (
        <button 
          className="connect-button"
          onClick={onConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <span className="spinner"></span>
              Connecting...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
                <circle cx="10" cy="10" r="3" fill="currentColor"/>
              </svg>
              Connect Wallet
            </>
          )}
        </button>
      ) : (
        <div className="wallet-info">
          <div className="address-badge">
            <div className="status-dot"></div>
            <span>{formatAddress(account)}</span>
          </div>
          <button className="disconnect-button" onClick={onDisconnect}>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
