import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, isAddress } from 'viem';
import { normalize } from 'viem/ens';
import { useEnsAddress } from 'wagmi';
import { useENS } from '../hooks/useENS';
import { useEFPProfile } from '../hooks/useEFPProfile';
import UserAvatar from './UserAvatar';
import { database } from '../config/firebase';
import { ref as dbRef, get } from 'firebase/database';
import '../styles/UserProfile.css';

const UserProfile = () => {
  const { address: userAddress } = useParams();
  const { address: currentUserAddress, isConnected } = useAccount();
  const navigate = useNavigate();
  
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [recipientInput, setRecipientInput] = useState(userAddress || '');
  const [copied, setCopied] = useState(false);
  const [profileData, setProfileData] = useState(null);
  
  const ensData = useENS(userAddress);
  const efpData = useEFPProfile(userAddress);

  // Fetch profile data from Firebase
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userAddress) return;
      
      try {
        const profileRef = dbRef(database, `profiles/${userAddress.toLowerCase()}`);
        const snapshot = await get(profileRef);
        
        if (snapshot.exists()) {
          setProfileData(snapshot.val());
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };

    fetchProfileData();
  }, [userAddress]);
  
  // Resolve ENS to address if needed
  const { data: resolvedAddress } = useEnsAddress({
    name: recipientInput?.includes('.') ? normalize(recipientInput) : undefined,
    enabled: recipientInput?.includes('.'),
  });

  const { data: hash, sendTransaction } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const displayName = efpData.name || ensData.name || `${userAddress?.slice(0, 10)}...${userAddress?.slice(-8)}`;
  const avatar = efpData.avatar || ensData.avatar;
  const isOwnProfile = currentUserAddress && userAddress?.toLowerCase() === currentUserAddress.toLowerCase();

  const handleCopyAddress = () => {
    if (userAddress) {
      navigator.clipboard.writeText(userAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyENS = () => {
    if (ensData.name) {
      navigator.clipboard.writeText(ensData.name);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendETH = async (e) => {
    e.preventDefault();
    
    if (!sendTransaction || !sendAmount) return;

    try {
      // Determine recipient address (could be ENS or address)
      const recipientAddr = recipientInput.includes('.') ? resolvedAddress : recipientInput;
      
      if (!recipientAddr || !isAddress(recipientAddr)) {
        alert('Invalid recipient address or ENS name');
        return;
      }

      sendTransaction({
        to: recipientAddr,
        value: parseEther(sendAmount),
      });
    } catch (error) {
      console.error('Error sending ETH:', error);
      alert('Failed to send ETH. Please try again.');
    }
  };

  const handleSendSuccess = () => {
    setShowSendModal(false);
    setSendAmount('');
    alert('ETH sent successfully!');
  };

  React.useEffect(() => {
    if (isConfirmed && hash) {
      handleSendSuccess();
    }
  }, [isConfirmed, hash]);

  if (!userAddress) {
    return (
      <div className="user-profile-container">
        <div className="profile-empty">
          <h3>User not found</h3>
          <button onClick={() => navigate(-1)} className="back-btn">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      <div className="profile-header">
        <button onClick={() => navigate(-1)} className="back-link">
          ← Back
        </button>
      </div>

      <div className="profile-card">
        <div className="profile-avatar-section">
          <UserAvatar
            address={userAddress}
            ensAvatar={avatar}
            ensName={displayName}
            size={120}
          />
          <h1 className="profile-name">{displayName}</h1>
          {efpData.bio && (
            <p className="profile-bio">{efpData.bio}</p>
          )}
          {ensData.description && !efpData.bio && (
            <p className="profile-bio">{ensData.description}</p>
          )}
        </div>

        <div className="profile-details">
          <div className="detail-section">
            <h3>Wallet Address</h3>
            <div className="address-display">
              <code className="address-code">{userAddress}</code>
              <button onClick={handleCopyAddress} className="copy-btn" title="Copy address">
                {copied ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M16.667 5L7.5 14.167 3.333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M3 13V5a2 2 0 0 1 2-2h8" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {ensData.name && (
            <div className="detail-section">
              <h3>ENS Domain</h3>
              <div className="address-display">
                <code className="ens-code">{ensData.name}</code>
                <button onClick={handleCopyENS} className="copy-btn" title="Copy ENS">
                  {copied ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M16.667 5L7.5 14.167 3.333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M3 13V5a2 2 0 0 1 2-2h8" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {efpData.followers !== undefined && (
            <div className="detail-section">
              <h3>EFP Stats</h3>
              <div className="efp-stats">
                <div className="stat-item">
                  <span className="stat-label">Followers</span>
                  <span className="stat-value">{efpData.followers}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Following</span>
                  <span className="stat-value">{efpData.following}</span>
                </div>
              </div>
            </div>
          )}

          {/* Profile Data from Firebase */}
          {profileData && (
            <>
              {profileData.email && (
                <div className="detail-section">
                  <h3>Email</h3>
                  <div className="profile-info">
                    <a href={`mailto:${profileData.email}`} className="info-link">
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                        <path d="M3 4h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M18 5l-8 6-8-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      {profileData.email}
                    </a>
                  </div>
                </div>
              )}

              {profileData.website && (
                <div className="detail-section">
                  <h3>Website</h3>
                  <div className="profile-info">
                    <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="info-link">
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M2 10h16M10 2a15.3 15.3 0 0 1 4 8 15.3 15.3 0 0 1-4 8 15.3 15.3 0 0 1-4-8 15.3 15.3 0 0 1 4-8z" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                      {profileData.website}
                    </a>
                  </div>
                </div>
              )}

              {(profileData.twitter || profileData.github || profileData.telegram || profileData.discord) && (
                <div className="detail-section">
                  <h3>Social Links</h3>
                  <div className="social-links">
                    {profileData.twitter && (
                      <a href={`https://twitter.com/${profileData.twitter}`} target="_blank" rel="noopener noreferrer" className="social-link" title="Twitter">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        @{profileData.twitter}
                      </a>
                    )}
                    {profileData.github && (
                      <a href={`https://github.com/${profileData.github}`} target="_blank" rel="noopener noreferrer" className="social-link" title="GitHub">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        @{profileData.github}
                      </a>
                    )}
                    {profileData.telegram && (
                      <a href={`https://t.me/${profileData.telegram}`} target="_blank" rel="noopener noreferrer" className="social-link" title="Telegram">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                        </svg>
                        @{profileData.telegram}
                      </a>
                    )}
                    {profileData.discord && (
                      <div className="social-link discord-tag" title="Discord">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                        </svg>
                        {profileData.discord}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {!isOwnProfile && isConnected && (
          <div className="profile-actions">
            <button className="action-btn primary" onClick={() => setShowSendModal(true)}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M18 8.5L2 2l6.5 16 2.5-6 6-2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Send ETH
            </button>
            <button className="action-btn secondary" onClick={() => navigate('/chat', { state: { recipientAddress: userAddress } })}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M17 9.5c0 4.14-3.36 7.5-7.5 7.5-1.27 0-2.47-.31-3.52-.86L2 17.5l1.36-3.98A7.47 7.47 0 0 1 2.5 10C2.5 5.86 5.86 2.5 10 2.5S17.5 5.86 17.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Message
            </button>
          </div>
        )}

        {isOwnProfile && (
          <div className="own-profile-badge">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M16.667 5L7.5 14.167 3.333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            This is your profile
          </div>
        )}
      </div>

      {/* Send ETH Modal */}
      {showSendModal && (
        <div className="modal-overlay" onClick={() => setShowSendModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Send ETH</h3>
              <button className="modal-close" onClick={() => setShowSendModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSendETH} className="send-form">
              <div className="form-group">
                <label>Recipient</label>
                <input
                  type="text"
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  placeholder="Address or ENS domain"
                  required
                />
                {recipientInput.includes('.') && resolvedAddress && (
                  <div className="resolved-address">
                    Resolves to: {resolvedAddress.slice(0, 10)}...{resolvedAddress.slice(-8)}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Amount (ETH)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="0.1"
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowSendModal(false)}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={isConfirming || isConfirmed || !sendAmount}
                >
                  {isConfirming ? (
                    <>
                      <div className="spinner-small"></div>
                      Confirming...
                    </>
                  ) : isConfirmed ? (
                    '✓ Sent'
                  ) : (
                    `Send ${sendAmount || '0'} ETH`
                  )}
                </button>
              </div>

              {hash && (
                <div className="transaction-link">
                  <a
                    href={`https://etherscan.io/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View transaction ↗
                  </a>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
