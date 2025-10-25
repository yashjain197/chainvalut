import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { database } from '../config/firebase';
import { ref as dbRef, onValue } from 'firebase/database';
import '../styles/LoanFundedNotification.css';

const LoanFundedNotification = () => {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const [activeLoan, setActiveLoan] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (!isConnected || !address) {
      setActiveLoan(null);
      setShowNotification(false);
      return;
    }

    const borrowsRef = dbRef(database, `borrows/${address.toLowerCase()}`);
    
    const unsubscribe = onValue(borrowsRef, (snapshot) => {
      if (snapshot.exists()) {
        const borrows = snapshot.val();
        const activeLoans = Object.entries(borrows).filter(([, loan]) => loan.status === 'active');
        
        if (activeLoans.length > 0) {
          // Show notification for the most recent active loan
          const [loanId, loanData] = activeLoans[activeLoans.length - 1];
          
          // Only show notification if loan was funded in the last 5 minutes
          const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
          if (loanData.fundedAt && loanData.fundedAt > fiveMinutesAgo) {
            setActiveLoan({ id: loanId, ...loanData });
            setShowNotification(true);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [isConnected, address]);

  const handleClose = () => {
    setShowNotification(false);
  };

  const handleGoToChat = () => {
    setShowNotification(false);
    // Navigate to chat with lender, passing the lender address
    navigate('/chat', { 
      state: { 
        recipientAddress: activeLoan.lenderAddress 
      } 
    });
  };

  if (!showNotification || !activeLoan) return null;

  const daysUntilDue = Math.ceil((activeLoan.dueDate - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="loan-funded-overlay">
      <div className="loan-funded-notification">
        <button className="notification-close" onClick={handleClose}>×</button>
        
        <div className="notification-icon">🎉</div>
        
        <h2>Loan Funded!</h2>
        <p className="notification-message">
          Your loan of <strong>{activeLoan.amount} ETH</strong> has been successfully funded!
        </p>
        
        <div className="loan-details-summary">
          <div className="detail-item">
            <span className="label">Principal Amount:</span>
            <span className="value">{activeLoan.amount} ETH</span>
          </div>
          <div className="detail-item">
            <span className="label">Interest Rate:</span>
            <span className="value">{activeLoan.interestRate}%</span>
          </div>
          <div className="detail-item">
            <span className="label">Total Repayment:</span>
            <span className="value highlight">{activeLoan.totalRepayment} ETH</span>
          </div>
          <div className="detail-item">
            <span className="label">Due In:</span>
            <span className="value">{daysUntilDue} days</span>
          </div>
        </div>

        <div className="notification-warning">
          ⚠️ Please repay on time to maintain good credit
        </div>

        <div className="notification-actions">
          <button className="secondary-btn" onClick={handleClose}>
            Dismiss
          </button>
          <button className="primary-btn" onClick={handleGoToChat}>
            Go to Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export { LoanFundedNotification };
