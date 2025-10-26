import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { database, auth } from '../config/firebase';
import { ref, onValue, set } from 'firebase/database';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useENS } from '../hooks/useENS';
import { useEFPProfile } from '../hooks/useEFPProfile';
import { useEnhancedWeb3 } from '../hooks/useEnhancedWeb3';
import UserAvatar from './UserAvatar';
import NomineeManagement from './NomineeManagement';
import '../styles/Profile.css';

const Profile = () => {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const ensData = useENS(address);
  const efpData = useEFPProfile(address);
  const { contract, balance } = useEnhancedWeb3();
  const [borrows, setBorrows] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    twitter: '',
    github: '',
    telegram: '',
    discord: '',
  });
  const [loading, setLoading] = useState(false);
  const [savedProfile, setSavedProfile] = useState(null);

  // Load saved profile from Firebase
  useEffect(() => {
    if (!isConnected || !address) return;

    const profileRef = ref(database, `profiles/${address.toLowerCase()}`);
    const unsubscribe = onValue(profileRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSavedProfile(data);
        setProfileData(data);
      }
    });

    return () => unsubscribe();
  }, [address, isConnected]);

  // Fetch user's borrows
  useEffect(() => {
    if (!isConnected || !address) return;

    const borrowsRef = ref(database, `borrows/${address.toLowerCase()}`);
    const unsubscribe = onValue(borrowsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const borrowsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => b.borrowedAt - a.borrowedAt);
        setBorrows(borrowsArray);
      } else {
        setBorrows([]);
      }
    });

    return () => unsubscribe();
  }, [address, isConnected]);

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Update profile with Google data
      setProfileData(prev => ({
        ...prev,
        name: prev.name || user.displayName || '',
        email: user.email || '',
      }));
      
      alert('Google account connected! You can now save your profile.');
    } catch (error) {
      console.error('Google sign in error:', error);
      alert('Failed to connect Google account. Please try again.');
    }
  };

  // Fetch from ENS/EFP
  const handleFetchFromENS = () => {
    setLoading(true);
    setProfileData({
      name: efpData.name || ensData.name || profileData.name,
      bio: efpData.bio || ensData.description || profileData.bio,
      email: profileData.email,
      phone: profileData.phone,
      location: efpData.location || profileData.location,
      website: efpData.url || ensData.url || profileData.website,
      twitter: efpData.socials.twitter || ensData.twitter || profileData.twitter,
      github: efpData.socials.github || ensData.github || profileData.github,
      telegram: efpData.socials.telegram || profileData.telegram,
      discord: efpData.socials.discord || profileData.discord,
    });
    setTimeout(() => setLoading(false), 500);
    alert('Profile data fetched from ENS/EFP!');
  };

  // Save profile to Firebase
  const handleSaveProfile = async () => {
    if (!address) return;
    
    try {
      setLoading(true);
      const profileRef = ref(database, `profiles/${address.toLowerCase()}`);
      await set(profileRef, {
        ...profileData,
        updatedAt: Date.now(),
        walletAddress: address.toLowerCase(),
      });
      
      setSavedProfile(profileData);
      setEditMode(false);
      alert('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isConnected) {
    return (
      <div className="profile-container">
        <div className="profile-empty">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
            <path d="M32 20v24M20 32h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h3>Connect Wallet to View Profile</h3>
          <p>Connect your wallet to see your profile information</p>
        </div>
      </div>
    );
  }

  const isLoading = ensData.isLoading || efpData.isLoading;

  return (
    <div className="profile-container">
      {efpData.header && (
        <div className="profile-header-image">
          <img src={efpData.header} alt="Profile header" />
        </div>
      )}

      <div className="profile-content">
        <div className="profile-main">
          <div className="profile-avatar-section">
            <UserAvatar
              address={address}
              ensAvatar={ensData.avatar || efpData.avatar}
              ensName={ensData.name || efpData.name}
              size={120}
              className="large"
            />
            
            <div className="profile-identity">
              <h1 className="profile-name">
                {profileData.name || efpData.name || ensData.name || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
              </h1>
              
              {ensData.name && (
                <div className="profile-ens-name">{ensData.name}</div>
              )}
              
              <div className="profile-address">
                {address}
                <button
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(address);
                    alert('Address copied!');
                  }}
                  title="Copy address"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M5.33 2.67H2.67v10.67h8V10.67M5.33 2.67v8h8V2.67h-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              {efpData.list && (
                <div className="efp-list-badge">
                  EFP List #{efpData.list}
                </div>
              )}

              {/* Edit Profile Button */}
              <button 
                className="edit-profile-btn"
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>

          {/* Edit Mode */}
          {editMode && (
            <div className="profile-edit-section">
              <h3>Edit Your Profile</h3>
              
              <div className="edit-actions">
                <button className="fetch-btn" onClick={handleFetchFromENS} disabled={loading}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.65 2.35A8 8 0 1 0 2.35 13.65 8 8 0 0 0 13.65 2.35zM8 14A6 6 0 1 1 8 2a6 6 0 0 1 0 12z"/>
                    <path d="M8 4v4l3 1.5"/>
                  </svg>
                  {loading ? 'Fetching...' : 'Fetch from ENS/EFP'}
                </button>
                
                <button className="google-signin-btn" onClick={handleGoogleSignIn}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z"/>
                  </svg>
                  Connect Google
                </button>
              </div>

              <div className="edit-form">
                <div className="form-row">
                  <div className="form-field">
                    <label>Display Name</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Your name"
                    />
                  </div>

                  <div className="form-field">
                    <label>Email</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="form-field">
                    <label>Location</label>
                    <input
                      type="text"
                      value={profileData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="City, Country"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label>Bio</label>
                  <textarea
                    rows="3"
                    value={profileData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="form-field">
                  <label>Website</label>
                  <input
                    type="url"
                    value={profileData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Twitter Handle</label>
                    <input
                      type="text"
                      value={profileData.twitter}
                      onChange={(e) => handleInputChange('twitter', e.target.value)}
                      placeholder="username"
                    />
                  </div>

                  <div className="form-field">
                    <label>GitHub Username</label>
                    <input
                      type="text"
                      value={profileData.github}
                      onChange={(e) => handleInputChange('github', e.target.value)}
                      placeholder="username"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Telegram Username</label>
                    <input
                      type="text"
                      value={profileData.telegram}
                      onChange={(e) => handleInputChange('telegram', e.target.value)}
                      placeholder="@username"
                    />
                  </div>

                  <div className="form-field">
                    <label>Discord Tag</label>
                    <input
                      type="text"
                      value={profileData.discord}
                      onChange={(e) => handleInputChange('discord', e.target.value)}
                      placeholder="username#1234"
                    />
                  </div>
                </div>

                <button 
                  className="save-profile-btn" 
                  onClick={handleSaveProfile}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          )}

          {/* Display saved or fetched profile data */}
          {!editMode && (savedProfile || profileData.bio || profileData.email) && (
            <>
              {profileData.bio && (
                <div className="profile-section">
                  <h3>Bio</h3>
                  <p className="profile-bio">{profileData.bio}</p>
                </div>
              )}

              {profileData.email && (
                <div className="profile-section">
                  <h3>Contact Information</h3>
                  <div className="contact-info">
                    {profileData.email && (
                      <div className="contact-item">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2zm13 2.383l-4.758 2.855L15 11.114v-5.73zm-.034 6.878L9.271 8.82 8 9.583 6.728 8.82l-5.694 3.44A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.739zM1 11.114l4.758-2.876L1 5.383v5.73z"/>
                        </svg>
                        <span>{profileData.email}</span>
                      </div>
                    )}
                    {profileData.phone && (
                      <div className="contact-item">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328z"/>
                        </svg>
                        <span>{profileData.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Original ENS/EFP sections for fallback */}
          {!editMode && !savedProfile && (efpData.bio || ensData.description) && (
            <div className="profile-section">
              <h3>Bio</h3>
              <p className="profile-bio">{efpData.bio || ensData.description}</p>
            </div>
          )}

          {efpData.location && (
            <div className="profile-section">
              <h3>Location</h3>
              <p className="profile-location">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C5.24 0 3 2.24 3 5c0 3.72 5 11 5 11s5-7.28 5-11c0-2.76-2.24-5-5-5zm0 7.5c-1.38 0-2.5-1.12-2.5-2.5S6.62 2.5 8 2.5s2.5 1.12 2.5 2.5S9.38 7.5 8 7.5z"/>
                </svg>
                {efpData.location}
              </p>
            </div>
          )}

          {(efpData.url || ensData.url) && (
            <div className="profile-section">
              <h3>Website</h3>
              <a 
                href={efpData.url || ensData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="profile-url"
              >
                {efpData.url || ensData.url}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M10.5 7.5v4.5h-9V3h4.5M7.5 1.5h5v5M6 8l6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          )}

          {Object.keys(efpData.socials).length > 0 && (
            <div className="profile-section">
              <h3>Social Links</h3>
              <div className="social-links">
                {efpData.socials.twitter && (
                  <a
                    href={`https://twitter.com/${efpData.socials.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link twitter"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    @{efpData.socials.twitter}
                  </a>
                )}

                {efpData.socials.github && (
                  <a
                    href={`https://github.com/${efpData.socials.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link github"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    {efpData.socials.github}
                  </a>
                )}

                {efpData.socials.telegram && (
                  <a
                    href={`https://t.me/${efpData.socials.telegram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link telegram"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.654-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                    </svg>
                    {efpData.socials.telegram}
                  </a>
                )}

                {efpData.socials.lens && (
                  <a
                    href={`https://hey.xyz/u/${efpData.socials.lens}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link lens"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm7.5 12c0 1.933-.787 3.68-2.056 4.944A7.455 7.455 0 0 1 12.5 19a7.455 7.455 0 0 1-4.944-2.056A7.455 7.455 0 0 1 5.5 12c0-1.933.787-3.68 2.056-4.944A7.455 7.455 0 0 1 12.5 5c1.933 0 3.68.787 4.944 2.056A7.455 7.455 0 0 1 19.5 12z"/>
                    </svg>
                    {efpData.socials.lens}
                  </a>
                )}
              </div>
            </div>
          )}

          {efpData.links.length > 0 && (
            <div className="profile-section">
              <h3>Links</h3>
              <div className="custom-links">
                {efpData.links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="custom-link"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 6a3 3 0 0 0 4.24.24l2-2a3 3 0 0 0-4.24-4.24l-1.42 1.42"/>
                      <path d="M9 8a3 3 0 0 0-4.24-.24l-2 2a3 3 0 0 0 4.24 4.24l1.42-1.42"/>
                    </svg>
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="profile-loading">
              <div className="spinner"></div>
              <p>Loading profile data...</p>
            </div>
          )}

          {/* Nominee Management Section */}
          {contract && address && (
            <NomineeManagement 
              contract={contract} 
              address={address}
              balance={balance}
            />
          )}

          {/* Borrows Section */}
          {borrows.length > 0 && (
            <div className="profile-section">
              <h3>My Borrows</h3>
              <div className="borrows-list">
                {borrows.map((borrow) => (
                  <BorrowCard key={borrow.id} borrow={borrow} navigate={navigate} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BorrowCard = ({ borrow, navigate }) => {
  const ensData = useENS(borrow.lenderAddress);
  const daysRemaining = Math.ceil((borrow.dueDate - Date.now()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysRemaining < 0;
  const isPaid = borrow.status === 'repaid';

  return (
    <div className={`borrow-card ${isPaid ? 'paid' : isOverdue ? 'overdue' : 'active'}`}>
      <div className="borrow-header">
        <div className="borrow-lender">
          <UserAvatar
            address={borrow.lenderAddress}
            ensAvatar={ensData.avatar}
            ensName={ensData.name}
            size={36}
          />
          <div>
            <div className="borrow-lender-name">
              {ensData.name || `${borrow.lenderAddress.slice(0, 6)}...${borrow.lenderAddress.slice(-4)}`}
            </div>
            <div className="borrow-date">
              Borrowed {new Date(borrow.borrowedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className={`borrow-status ${borrow.status}`}>
          {borrow.status === 'repaid' ? '✓ Paid' : isOverdue ? 'Overdue' : 'Active'}
        </div>
      </div>

      <div className="borrow-details">
        <div className="borrow-row">
          <span>Amount:</span>
          <span className="borrow-value">{borrow.amount} ETH</span>
        </div>
        <div className="borrow-row">
          <span>Total Repayment:</span>
          <span className="borrow-value highlight">{parseFloat(borrow.totalRepayment || 0).toFixed(4)} ETH</span>
        </div>
        <div className="borrow-row">
          <span>Due Date:</span>
          <span className={isOverdue && !isPaid ? 'overdue-text' : ''}>
            {new Date(borrow.dueDate).toLocaleDateString()}
            {!isPaid && (isOverdue ? ` (${Math.abs(daysRemaining)}d overdue)` : ` (${daysRemaining}d left)`)}
          </span>
        </div>
      </div>

      {!isPaid && (
        <button
          className="repay-btn"
          onClick={() => navigate(`/payment/${borrow.id}`)}
        >
          Repay Now
        </button>
      )}

      {isPaid && borrow.transactionHash && (
        <div className="paid-info">
          <a
            href={`https://etherscan.io/tx/${borrow.transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="tx-link"
          >
            View Payment ↗
          </a>
        </div>
      )}
    </div>
  );
};

export default Profile;
