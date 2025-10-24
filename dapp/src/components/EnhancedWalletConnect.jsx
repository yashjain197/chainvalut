import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useENS } from '../hooks/useENS';
import UserAvatar from './UserAvatar';
import '../styles/EnhancedWalletConnect.css';

const EnhancedWalletConnect = () => {
  const { address } = useAccount();
  const ensData = useENS(address);

  return (
    <div className="enhanced-wallet-connect">
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          const ready = mounted && authenticationStatus !== 'loading';
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus || authenticationStatus === 'authenticated');

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                style: {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <button 
                      onClick={openConnectModal} 
                      type="button"
                      className="connect-wallet-button"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M17.5 6.25H2.5C1.81 6.25 1.25 6.81 1.25 7.5V16.25C1.25 16.94 1.81 17.5 2.5 17.5H17.5C18.19 17.5 18.75 16.94 18.75 16.25V7.5C18.75 6.81 18.19 6.25 17.5 6.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M13.75 17.5V3.75C13.75 3.41848 13.6183 3.10054 13.3839 2.86612C13.1495 2.6317 12.8315 2.5 12.5 2.5H7.5C7.16848 2.5 6.85054 2.6317 6.61612 2.86612C6.3817 3.10054 6.25 3.41848 6.25 3.75V17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Connect Wallet
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button 
                      onClick={openChainModal} 
                      type="button"
                      className="wrong-network-button"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 0L0 6v8c0 6.2 4.3 12 10 14 5.7-2 10-7.8 10-14V6L10 0z" fill="currentColor" opacity="0.3"/>
                        <path d="M9 13h2v2H9v-2zm0-8h2v6H9V5z" fill="currentColor"/>
                      </svg>
                      Wrong Network
                    </button>
                  );
                }

                // Connected view with ENS/avatar
                return (
                  <div className="wallet-info-container">
                    <button
                      onClick={openAccountModal}
                      className="account-button profile-button"
                      type="button"
                    >
                      <UserAvatar 
                        address={address}
                        ensAvatar={ensData.avatar}
                        ensName={ensData.name || account.displayName}
                        size={36}
                      />

                      <div className="profile-meta">
                        <div className="profile-name">
                          {ensData.name || account.displayName}
                        </div>
                        {account.displayBalance && (
                          <div className="profile-balance">{account.displayBalance}</div>
                        )}
                      </div>
                    </button>

                    {ensData.name && (ensData.description || ensData.twitter || ensData.github || ensData.url) && (
                      <div className="ens-info-tooltip">
                        {ensData.description && (
                          <div className="ens-detail">
                            <span className="ens-label">Bio:</span>
                            <span className="ens-value">{ensData.description}</span>
                          </div>
                        )}
                        {ensData.twitter && (
                          <div className="ens-detail">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                            <a href={`https://twitter.com/${ensData.twitter}`} target="_blank" rel="noopener noreferrer">
                              @{ensData.twitter}
                            </a>
                          </div>
                        )}
                        {ensData.github && (
                          <div className="ens-detail">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            <a href={`https://github.com/${ensData.github}`} target="_blank" rel="noopener noreferrer">
                              {ensData.github}
                            </a>
                          </div>
                        )}
                        {ensData.url && (
                          <div className="ens-detail">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                            </svg>
                            <a href={ensData.url} target="_blank" rel="noopener noreferrer">
                              {ensData.url}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
};

export default EnhancedWalletConnect;
