import React from 'react';
import '../styles/LenderVerificationWarning.css';

const LenderVerificationWarning = ({ amount, onAcknowledge, onCancel }) => {
  
  return (
    <div className="lender-warning-overlay">
      <div className="lender-warning-modal">
        <div className="warning-header">
          <div className="warning-icon">⚠️</div>
          <h3>Lender Due Diligence Required</h3>
        </div>
        
        <div className="warning-body">
          <p className="warning-intro">
            You are about to lend <strong>{amount} ETH</strong> to this borrower. Please verify their identity and creditworthiness independently before proceeding.
          </p>
          
          <div className="verification-checklist">
            <h4>Recommended Verification Steps:</h4>
            <ul>
              <li>✓ Request government-issued ID from borrower</li>
              <li>✓ Verify proof of income or employment</li>
              <li>✓ Check borrower's lending/borrowing history</li>
              <li>✓ Review borrower's profile and reputation</li>
              <li>✓ Communicate via voice/video call if possible</li>
              <li>✓ Request additional documents or collateral if unsure</li>
            </ul>
          </div>
          
          <div className="risk-disclaimer">
            <h4>Important Disclaimers:</h4>
            <ul>
              <li><strong>You are lending at your own risk</strong></li>
              <li>ChainVault facilitates but does NOT guarantee repayment</li>
              <li>No recourse if borrower defaults (beyond collateral)</li>
              <li>Platform is not responsible for borrower verification</li>
              <li>You may lose your funds if borrower does not repay</li>
            </ul>
          </div>
        </div>
        
        <div className="warning-footer">
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button 
            className="proceed-btn" 
            onClick={onAcknowledge}
          >
            I Understand - Proceed to Fund
          </button>
        </div>
      </div>
    </div>
  );
};

export default LenderVerificationWarning;
