import React from 'react';
import { useWeb3 } from './hooks/useWeb3';
import WalletConnect from './components/WalletConnect';
import BalanceCard from './components/BalanceCard';
import ActionPanel from './components/ActionPanel';
import TransactionHistory from './components/TransactionHistory';
import './App.css';

function App() {
  const {
    account,
    contract,
    balance,
    ethBalance,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    updateBalances,
  } = useWeb3();

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="url(#gradient)" />
            <path d="M16 8L9 13L16 17L23 13L16 8Z" fill="white" opacity="0.9"/>
            <path d="M9 15L16 20L23 15L16 24L9 15Z" fill="white" opacity="0.7"/>
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32">
                <stop offset="0%" stopColor="#1A73E8" />
                <stop offset="100%" stopColor="#00E0FF" />
              </linearGradient>
            </defs>
          </svg>
          <h1>ChainVault</h1>
        </div>

        <WalletConnect
          account={account}
          isConnecting={isConnecting}
          onConnect={connectWallet}
          onDisconnect={disconnectWallet}
        />
      </header>

      {error && (
        <div className="error-banner">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15H9v-2h2v2zm0-4H9V5h2v6z" fill="currentColor"/>
          </svg>
          {error}
        </div>
      )}

      <main className="app-main">
        {!account ? (
          <div className="welcome-section">
            <div className="welcome-content">
              <h2>Welcome to ChainVault</h2>
              <p>Your secure, decentralized vault for managing ETH</p>
              <div className="features">
                <div className="feature">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="currentColor" opacity="0.2"/>
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" fill="currentColor"/>
                  </svg>
                  <div>
                    <h3>Secure Storage</h3>
                    <p>Smart contract-based vault for your ETH</p>
                  </div>
                </div>
                <div className="feature">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor" opacity="0.2"/>
                    <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor"/>
                  </svg>
                  <div>
                    <h3>Real-time Tracking</h3>
                    <p>Monitor all transactions and balances</p>
                  </div>
                </div>
                <div className="feature">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" fill="currentColor" opacity="0.2"/>
                    <path d="M7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" fill="currentColor"/>
                  </svg>
                  <div>
                    <h3>Live ETH Price</h3>
                    <p>Chainlink price feeds integration</p>
                  </div>
                </div>
              </div>
              <button className="cta-button" onClick={connectWallet}>
                Connect Wallet to Get Started
              </button>
            </div>
          </div>
        ) : (
          <div className="dashboard">
            <div className="dashboard-grid">
              <div className="grid-item balance-section">
                <BalanceCard
                  contract={contract}
                  balance={balance}
                  ethBalance={ethBalance}
                  onUpdate={updateBalances}
                />
              </div>

              <div className="grid-item actions-section">
                <ActionPanel
                  contract={contract}
                  onTransactionComplete={updateBalances}
                />
              </div>

              <div className="grid-item history-section">
                <TransactionHistory
                  contract={contract}
                  account={account}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>ChainVault v1.0</p>
        <p>Secured by blockchain technology</p>
      </footer>
    </div>
  );
}

export default App;
