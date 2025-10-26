import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { database } from '../config/firebase';
import { ref, push, onValue, update, remove } from 'firebase/database';
import UserAvatar from './UserAvatar';
import { useENS } from '../hooks/useENS';
import { useEFPProfile } from '../hooks/useEFPProfile';
import '../styles/LendingMarketplace.css';

const LendingMarketplace = () => {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMyOffersModal, setShowMyOffersModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [expandedOfferId, setExpandedOfferId] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    interestRate: '',
    duration: '30',
    description: '',
  });

  // Fetch lending offers from Firebase
  useEffect(() => {
    const offersRef = ref(database, 'lendingOffers');
    
    const unsubscribe = onValue(offersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const offersArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }))
        // Filter out borrowed/pending/repaid offers and sort by creation date
        .filter(offer => offer.status === 'active')
        .sort((a, b) => b.createdAt - a.createdAt);
        setOffers(offersArray);
      } else {
        setOffers([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const myOffers = offers.filter(offer => 
    offer.lenderAddress.toLowerCase() === address?.toLowerCase()
  );

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      if (editingOffer) {
        // Update existing offer
        const offerRef = ref(database, `lendingOffers/${editingOffer.id}`);
        await update(offerRef, {
          amount: formData.amount,
          interestRate: parseFloat(formData.interestRate),
          duration: parseInt(formData.duration),
          description: formData.description,
          updatedAt: Date.now(),
        });
        alert('Offer updated successfully!');
      } else {
        // Create new offer
        const offersRef = ref(database, 'lendingOffers');
        const newOffer = {
          lenderAddress: address.toLowerCase(),
          amount: formData.amount,
          interestRate: parseFloat(formData.interestRate),
          duration: parseInt(formData.duration),
          description: formData.description,
          status: 'active',
          createdAt: Date.now(),
          borrower: null,
        };
        await push(offersRef, newOffer);
        alert('Lending offer created successfully!');
      }

      // Reset form
      setFormData({
        amount: '',
        interestRate: '',
        duration: '30',
        description: '',
      });
      setShowCreateModal(false);
      setEditingOffer(null);
    } catch (error) {
      console.error('Error saving offer:', error);
      alert('Failed to save offer. Please try again.');
    }
  };

  const handleEditOffer = (offer) => {
    setEditingOffer(offer);
    setFormData({
      amount: offer.amount,
      interestRate: offer.interestRate.toString(),
      duration: offer.duration.toString(),
      description: offer.description || '',
    });
    setShowCreateModal(true);
    setShowMyOffersModal(false);
  };

  const handleDeleteOffer = async (offerId) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) {
      return;
    }

    try {
      const offerRef = ref(database, `lendingOffers/${offerId}`);
      await remove(offerRef);
      alert('Offer deleted successfully!');
    } catch (error) {
      console.error('Error deleting offer:', error);
      alert('Failed to delete offer. Please try again.');
    }
  };

  const handleBorrow = async (offerId, offer) => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    if (offer.lenderAddress.toLowerCase() === address.toLowerCase()) {
      alert('You cannot borrow from your own offer');
      return;
    }

    if (offer.status !== 'active') {
      alert('This offer is no longer available');
      return;
    }

    // Open chat with lender and pass lending offer details
    navigate('/chat', { 
      state: { 
        recipientAddress: offer.lenderAddress,
        lendingOffer: {
          id: offerId,
          amount: offer.amount,
          interestRate: offer.interestRate,
          duration: offer.duration,
          description: offer.description,
          lenderAddress: offer.lenderAddress
        }
      } 
    });
  };

  const toggleExpand = (offerId) => {
    setExpandedOfferId(expandedOfferId === offerId ? null : offerId);
  };

  return (
    <div className="lending-marketplace">
      <div className="marketplace-header">
        <div>
          <h1>Lending Marketplace</h1>
          <p className="marketplace-subtitle">
            Browse active lending offers and borrow ETH with custom terms.
          </p>
        </div>
        <div className="header-actions">
          {isConnected && myOffers.length > 0 && (
            <button 
              className="manage-offers-btn"
              onClick={() => setShowMyOffersModal(true)}
            >
              My Offers ({myOffers.length})
            </button>
          )}
          {isConnected && (
            <button 
              className="create-offer-btn"
              onClick={() => {
                setEditingOffer(null);
                setFormData({
                  amount: '',
                  interestRate: '',
                  duration: '30',
                  description: '',
                });
                setShowCreateModal(true);
              }}
            >
              + Create Offer
            </button>
          )}
        </div>
      </div>

      {/* Offers List */}
      <div className="offers-list">
        {offers.length === 0 ? (
          <div className="no-offers">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
              <path d="M32 20v24M20 32h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <h3>No lending offers yet</h3>
            <p>Be the first to create a lending offer!</p>
          </div>
        ) : (
          offers.map((offer) => (
            <OfferRow 
              key={offer.id} 
              offer={offer} 
              currentUser={address}
              isExpanded={expandedOfferId === offer.id}
              onToggleExpand={() => toggleExpand(offer.id)}
              onBorrow={() => handleBorrow(offer.id, offer)}
            />
          ))
        )}
      </div>

      {/* Create/Edit Offer Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => {
          setShowCreateModal(false);
          setEditingOffer(null);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingOffer ? 'Edit Lending Offer' : 'Create Lending Offer'}</h3>
              <button className="modal-close" onClick={() => {
                setShowCreateModal(false);
                setEditingOffer(null);
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateOffer} className="offer-form">
              <div className="form-group">
                <label>Amount (ETH)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="e.g., 1.5"
                />
              </div>

              <div className="form-group">
                <label>Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                  placeholder="e.g., 5.5"
                />
              </div>

              <div className="form-group">
                <label>Duration (days)</label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  required
                >
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add any terms, requirements, or notes..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => {
                  setShowCreateModal(false);
                  setEditingOffer(null);
                }}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingOffer ? 'Update Offer' : 'Create Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* My Offers Modal */}
      {showMyOffersModal && (
        <div className="modal-overlay" onClick={() => setShowMyOffersModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>My Lending Offers</h3>
              <button className="modal-close" onClick={() => setShowMyOffersModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <div className="my-offers-list">
              {myOffers.length === 0 ? (
                <p className="no-offers-text">You haven't created any offers yet.</p>
              ) : (
                myOffers.map((offer) => (
                  <div key={offer.id} className="my-offer-item">
                    <div className="offer-details-compact">
                      <div className="detail-row">
                        <span className="label">Amount:</span>
                        <span className="value">{offer.amount} ETH</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Interest:</span>
                        <span className="value">{offer.interestRate}%</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Duration:</span>
                        <span className="value">{offer.duration} days</span>
                      </div>
                      {offer.description && (
                        <div className="detail-row">
                          <span className="label">Description:</span>
                          <span className="value">{offer.description}</span>
                        </div>
                      )}
                    </div>
                    <div className="offer-actions-compact">
                      <button onClick={() => handleEditOffer(offer)} className="edit-btn">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M11.333 2A1.886 1.886 0 0 1 14 4.667l-9 9-3.667 1 1-3.667 9-9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Edit
                      </button>
                      <button onClick={() => handleDeleteOffer(offer.id)} className="delete-btn">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4h9.334z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const OfferRow = ({ offer, currentUser, isExpanded, onToggleExpand, onBorrow }) => {
  const ensData = useENS(offer.lenderAddress);
  const efpData = useEFPProfile(offer.lenderAddress);
  const navigate = useNavigate();
  const isOwnOffer = currentUser && offer.lenderAddress.toLowerCase() === currentUser.toLowerCase();
  
  const displayName = efpData.name || ensData.name || `${offer.lenderAddress.slice(0, 6)}...${offer.lenderAddress.slice(-4)}`;
  const avatar = efpData.avatar || ensData.avatar;
  const totalRepayment = parseFloat(offer.amount) * (1 + offer.interestRate / 100);
  const daysAgo = Math.floor((Date.now() - offer.createdAt) / (1000 * 60 * 60 * 24));

  return (
    <div className={`offer-row ${isExpanded ? 'expanded' : ''}`}>
      <div className="offer-row-header" onClick={onToggleExpand}>
        <div className="lender-info-row">
          <UserAvatar 
            address={offer.lenderAddress}
            ensAvatar={avatar}
            ensName={displayName}
            size={40}
          />
          <div className="lender-details-row">
            <div 
              className="lender-name-clickable" 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${offer.lenderAddress}`);
              }}
            >
              {displayName}
            </div>
            <div className="offer-time">{daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}</div>
          </div>
        </div>

        <div className="offer-overview">
          <div className="overview-item">
            <span className="overview-label">Amount</span>
            <span className="overview-value">{offer.amount} ETH</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">Interest</span>
            <span className="overview-value">{offer.interestRate}%</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">Duration</span>
            <span className="overview-value">{offer.duration}d</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">Repayment</span>
            <span className="overview-value highlight">{totalRepayment.toFixed(4)} ETH</span>
          </div>
        </div>

        <div className="expand-indicator">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={isExpanded ? 'rotated' : ''}>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="offer-row-details">
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Lender Address</span>
              <code className="detail-value">{offer.lenderAddress}</code>
            </div>
            {offer.description && (
              <div className="detail-item full-width">
                <span className="detail-label">Description</span>
                <p className="detail-value">{offer.description}</p>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">Created</span>
              <span className="detail-value">{new Date(offer.createdAt).toLocaleDateString()}</span>
            </div>
            {offer.updatedAt && (
              <div className="detail-item">
                <span className="detail-label">Last Updated</span>
                <span className="detail-value">{new Date(offer.updatedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className="offer-row-actions">
            {isOwnOffer ? (
              <div className="own-offer-badge-row">Your Offer</div>
            ) : (
              <button className="borrow-btn-row" onClick={(e) => {
                e.stopPropagation();
                onBorrow();
              }}>
                Connect to Discuss
              </button>
            )}
          </div>

          <div className="risk-warning-row">
            ⚠️ P2P lending - Connect with lender in chat to arrange the loan details
          </div>
        </div>
      )}
    </div>
  );
};

export default LendingMarketplace;
