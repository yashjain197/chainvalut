import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { useEnhancedWeb3 } from './hooks/useEnhancedWeb3';
import { useENS } from './hooks/useENS';
import EnhancedWalletConnect from './components/EnhancedWalletConnect';
import UserAvatar from './components/UserAvatar';
import BalanceCard from './components/BalanceCard';
import ActionPanel from './components/ActionPanel';
import TransactionHistory from './components/TransactionHistory';
import LendingMarketplace from './components/LendingMarketplace';
import Chat from './components/Chat';
import Profile from './components/Profile';
import './App.css';

function App() {
  const {
    address,
    isConnected,
    contract,
    balance,
    ethBalance,
    updateBalances,
  } = useEnhancedWeb3();

  const ensData = useENS(address);

  return (
    <Router>
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

          {isConnected && (
            <nav className="main-nav">
              <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} end>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 7l7-5 7 5v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 17v-7h6v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Dashboard</span>
              </NavLink>
              
              <NavLink to="/lending" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M17 10c0 3.87-3.13 7-7 7s-7-3.13-7-7 3.13-7 7-7 7 3.13 7 7z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 5.5V10l3 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>Lending</span>
              </NavLink>

              <NavLink to="/chat" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M17 9.5c0 4.14-3.36 7.5-7.5 7.5-1.27 0-2.47-.31-3.52-.86L2 17.5l1.36-3.98A7.47 7.47 0 0 1 2.5 10C2.5 5.86 5.86 2.5 10 2.5S17.5 5.86 17.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Chat</span>
              </NavLink>

              <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16 17v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Profile</span>
              </NavLink>
            </nav>
          )}

          <EnhancedWalletConnect />
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={
              !isConnected ? (
                <WelcomePage />
              ) : (
                <DashboardPage 
                  ensData={ensData}
                  address={address}
                  contract={contract}
                  balance={balance}
                  ethBalance={ethBalance}
                  updateBalances={updateBalances}
                />
              )
            } />
            
            <Route path="/lending" element={<LendingMarketplace />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>ChainVault v2.0</p>
          <p>Secured by blockchain technology • P2P Lending Platform</p>
        </footer>
      </div>
    </Router>
  );
}

const WelcomePage = () => {
  return (
    <div className="welcome-content">
      <div className="hero-section">
        <div className="hero-icon">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="38" stroke="url(#heroGradient)" strokeWidth="4" opacity="0.3"/>
            <circle cx="40" cy="40" r="30" fill="url(#heroGradient)" opacity="0.1"/>
            <path d="M40 20L25 30L40 37.5L55 30L40 20Z" fill="url(#heroGradient)"/>
            <path d="M25 33L40 42L55 33L40 52L25 33Z" fill="url(#heroGradient)" opacity="0.7"/>
            <defs>
              <linearGradient id="heroGradient" x1="0" y1="0" x2="80" y2="80">
                <stop offset="0%" stopColor="#1A73E8" />
                <stop offset="50%" stopColor="#00E0FF" />
                <stop offset="100%" stopColor="#4FC3F7" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h2>Welcome to ChainVault</h2>
        <p className="hero-description">
          Secure vault for your assets with P2P lending marketplace.
          Deposit, lend, borrow ETH with complete control.
        </p>
        <div className="connect-prompt">
          <p className="connect-hint">Connect your wallet to get started</p>
        </div>
      </div>

      <div className="features">
        <div className="feature-card">
          <div className="feature-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 2L4 8v10c0 7.33 5.06 14.18 12 16 6.94-1.82 12-8.67 12-16V8L16 2z" fill="url(#featureGradient1)" opacity="0.2"/>
              <path d="M16 2L4 8v10c0 7.33 5.06 14.18 12 16 6.94-1.82 12-8.67 12-16V8L16 2zm0 14.65H26c-.7 5.49-4.37 10.38-10 11.92V16H6V9.73l10-4.15v11.07z" fill="url(#featureGradient1)"/>
              <defs>
                <linearGradient id="featureGradient1" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stopColor="#1A73E8" />
                  <stop offset="100%" stopColor="#4FC3F7" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h3>Secure Vault</h3>
          <p>Smart contract-based vault with industry-leading security</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 4C9.37 4 4 9.37 4 16s5.37 12 12 12 12-5.37 12-12S22.63 4 16 4zm0 21.6c-5.29 0-9.6-4.31-9.6-9.6S10.71 6.4 16 6.4s9.6 4.31 9.6 9.6-4.31 9.6-9.6 9.6z" fill="url(#featureGradient2)" opacity="0.2"/>
              <path d="M16.67 10H14.67v8l6.66 3.99 1-1.66-5.66-3.36z" fill="url(#featureGradient2)"/>
              <defs>
                <linearGradient id="featureGradient2" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stopColor="#00E0FF" />
                  <stop offset="100%" stopColor="#4FC3F7" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h3>P2P Lending</h3>
          <p>Lend and borrow ETH directly with customizable terms</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M28 10H20L18 6H14L12 10H4v16h24V10z" fill="url(#featureGradient3)" opacity="0.2"/>
              <path d="M16 14a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" fill="url(#featureGradient3)"/>
              <defs>
                <linearGradient id="featureGradient3" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stopColor="#1A73E8" />
                  <stop offset="100%" stopColor="#00E0FF" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h3>Live Messaging</h3>
          <p>Real-time chat to discuss and agree on lending terms</p>
        </div>
      </div>
    </div>
  );
};

const DashboardPage = ({ ensData, address, contract, balance, ethBalance, updateBalances }) => {
  return (
    <div className="dashboard">
      {ensData.name && (
        <div className="dashboard-welcome">
          <UserAvatar 
            address={address}
            ensAvatar={ensData.avatar}
            ensName={ensData.name}
            size={64}
            className="large"
          />
          <div className="welcome-info">
            <h2>Welcome back, {ensData.name}!</h2>
            {ensData.description && (
              <p className="user-description">{ensData.description}</p>
            )}
          </div>
        </div>
      )}
      
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
            account={address}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
