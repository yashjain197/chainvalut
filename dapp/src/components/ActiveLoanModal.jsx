import React, { useState } from 'react';
import { useENS } from '../hooks/useENS';
import UserAvatar from './UserAvatar';
import '../styles/ActiveLoanModal.css';

const ActiveLoanModal = ({ loan, onClose, onRepay }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const lenderEnsData = useENS(loan.lenderAddress);

  const calculateDaysRemaining = () => {
    if (!loan.dueDate) return 0;
    const now = Date.now();
    const due = new Date(loan.dueDate).getTime();
    const diff = due - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const handleFullRepayment = async () => {
    setIsProcessing(true);
    try {
      const success = await onRepay(loan);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error initiating repayment:', error);
      alert('Failed to initiate repayment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const lenderDisplayName = lenderEnsData.name || `${loan.lenderAddress?.slice(0, 6)}...${loan.lenderAddress?.slice(-4)}`;
  const daysRemaining = calculateDaysRemaining();
  const isOverdue = daysRemaining === 0 && loan.status === 'active';
  const remainingAmount = loan.remainingAmount || loan.totalRepayment || loan.amount;

  return (
    <div className="active-loan-modal-overlay" onClick={onClose}>
      <div className="active-loan-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>💳 Active Loan</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="loan-content">
          <div className="lender-info">
            <UserAvatar
              address={loan.lenderAddress}
              ensAvatar={lenderEnsData.avatar}
              ensName={lenderDisplayName}
              size={60}
            />
            <div className="lender-details">
              <h3>{lenderDisplayName}</h3>
              <p className="lender-address">{loan.lenderAddress}</p>
            </div>
          </div>

          <div className={`status-badge ${isOverdue ? 'overdue' : 'active'}`}>
            {isOverdue ? '⚠️ OVERDUE' : '✓ ACTIVE'}
          </div>

          <div className="loan-details">
            <div className="detail-row">
              <span className="detail-label">Original Amount</span>
              <span className="detail-value">{loan.amount} ETH</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Interest Rate</span>
              <span className="detail-value">{loan.interestRate}%</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Total Repayment</span>
              <span className="detail-value total-highlight">{loan.totalRepayment || loan.amount} ETH</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Remaining Balance</span>
              <span className="detail-value amount-highlight">{remainingAmount} ETH</span>
            </div>
            {loan.paidInstallments && loan.paidInstallments.length > 0 && (
              <div className="detail-row">
                <span className="detail-label">Paid So Far</span>
                <span className="detail-value success-text">
                  {loan.paidInstallments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(4)} ETH
                </span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">Due Date</span>
              <span className={`detail-value ${isOverdue ? 'overdue-text' : ''}`}>
                {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'N/A'}
                {!isOverdue && ` (${daysRemaining} days)`}
              </span>
            </div>
          </div>

          <div className="loan-actions">
            <button
              className="action-btn repay-btn"
              onClick={handleFullRepayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="spinner-small"></div>
                  Processing Transaction...
                </>
              ) : (
                `💰 Repay ${remainingAmount} ETH`
              )}
            </button>
          </div>

          <div className="repayment-info">
            <p className="info-text">
              💡 This will send <strong>{remainingAmount} ETH</strong> from your vault to the lender.
            </p>
            {isOverdue && (
              <p className="warning-text">
                ⚠️ This loan is overdue. Please repay immediately.
              </p>
            )}
            <p className="info-text-small">
              Make sure you have sufficient balance in your vault before proceeding.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveLoanModal;
