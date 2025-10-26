import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { database } from '../config/firebase';
import { ref as dbRef, update } from 'firebase/database';
import { useENS } from '../hooks/useENS';
import UserAvatar from './UserAvatar';
import '../styles/BorrowRequestModal.css';

const BorrowRequestModal = ({ request, onClose, onAccept, onReject }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const ensData = useENS(request.borrowerAddress);

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await onAccept(request);
      
      // If this request is tied to a lending offer, update its status
      if (request.offerId) {
        const offerRef = dbRef(database, `lendingOffers/${request.offerId}`);
        await update(offerRef, {
          status: 'borrowed',
          borrower: request.borrowerAddress,
          borrowedAt: Date.now()
        });
      }
      
      // Navigate to dashboard payment tab with loan details
      navigate('/', {
        state: {
          openPayment: true,
          borrowRequest: request,
          mode: 'fund'
        }
      });
      onClose();
    } catch (error) {
      console.error('Error accepting borrow request:', error);
      alert('Failed to accept request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await onReject(request);
      onClose();
    } catch (error) {
      console.error('Error rejecting borrow request:', error);
      alert('Failed to reject request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const displayName = ensData.name || `${request.borrowerAddress?.slice(0, 6)}...${request.borrowerAddress?.slice(-4)}`;
  const interestAmount = (parseFloat(request.amount) * (parseFloat(request.interestRate) / 100)).toFixed(4);
  const totalRepayment = (parseFloat(request.amount) + parseFloat(interestAmount)).toFixed(4);

  return (
    <div className="borrow-request-modal-overlay" onClick={onClose}>
      <div className="borrow-request-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Borrow Request</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="request-content">
          <div className="borrower-info">
            <UserAvatar
              address={request.borrowerAddress}
              ensAvatar={ensData.avatar}
              ensName={displayName}
              size={60}
            />
            <div className="borrower-details">
              <h3>{displayName}</h3>
              <p className="borrower-address">{request.borrowerAddress}</p>
            </div>
          </div>

          <div className="request-details">
            <div className="detail-row">
              <span className="detail-label">Requested Amount</span>
              <span className="detail-value amount-highlight">{request.amount} ETH</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Interest Rate</span>
              <span className="detail-value">{request.interestRate}%</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Duration</span>
              <span className="detail-value">{request.duration} days</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Interest Amount</span>
              <span className="detail-value">{interestAmount} ETH</span>
            </div>
            <div className="detail-row total-row">
              <span className="detail-label">Total Repayment</span>
              <span className="detail-value total-highlight">{totalRepayment} ETH</span>
            </div>
            {request.reason && (
              <div className="request-reason">
                <span className="detail-label">Reason:</span>
                <p>{request.reason}</p>
              </div>
            )}
          </div>

          <div className="request-actions">
            <button
              className="reject-btn"
              onClick={handleReject}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Reject'}
            </button>
            <button
              className="accept-btn"
              onClick={handleAccept}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Accept & Fund'}
            </button>
          </div>

          <p className="modal-note">
            Accepting will take you to the payment page where you can fund this loan from your vault.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BorrowRequestModal;
