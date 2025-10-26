import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { useEnhancedWeb3 } from '../hooks/useEnhancedWeb3';
import { database } from '../config/firebase';
import { ref as dbRef, push, set, update } from 'firebase/database';
import { useENS } from '../hooks/useENS';
import UserAvatar from './UserAvatar';
import LenderVerificationWarning from './LenderVerificationWarning';
import '../styles/InlineFundingModal.css';

const InlineFundingModal = ({ request, conversationId, onClose, onFundingComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [vaultBalance, setVaultBalance] = useState('0');
  const [showVerificationWarning, setShowVerificationWarning] = useState(false);
  const { address } = useAccount();
  const { contract } = useEnhancedWeb3();
  const ensData = useENS(request.borrowerAddress);

  // Fetch vault balance on mount
  useEffect(() => {
    const fetchBalance = async () => {
      if (contract && address) {
        try {
          const balance = await contract.balanceOf(address);
          setVaultBalance(ethers.formatEther(balance));
        } catch (err) {
          console.error('Error fetching vault balance:', err);
        }
      }
    };
    fetchBalance();
  }, [contract, address]);

  const handleFundClick = () => {
    // Show verification warning first
    setShowVerificationWarning(true);
  };

  const handleVerificationAcknowledged = () => {
    // User acknowledged the warning, proceed with funding
    setShowVerificationWarning(false);
    handleFund();
  };

  const handleVerificationCancelled = () => {
    // User cancelled, close the warning
    setShowVerificationWarning(false);
  };

  const handleFund = async () => {
    if (!contract || !address) {
      setError('Wallet not connected');
      return;
    }

    setIsProcessing(true);
    setError('');
    setTxHash('');

    try {
      const amount = ethers.parseEther(request.amount);
      
      // Check vault balance first
      const vaultBalance = await contract.balanceOf(address);
      if (vaultBalance < amount) {
        const balanceInEth = ethers.formatEther(vaultBalance);
        setError(`Insufficient vault balance. You have ${balanceInEth} ETH in your vault but need ${request.amount} ETH. Please deposit more funds to your vault first.`);
        setIsProcessing(false);
        return;
      }
      
      // Generate proper bytes32 ref for smart contract
      const ref = ethers.hexlify(ethers.randomBytes(32));
      
      // Send transaction
      const tx = await contract.pay(request.borrowerAddress, amount, ref);
      setTxHash(tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait(1);
      
      // Verify transaction success
      if (receipt.status !== 1) {
        setError('Transaction failed. No funds were transferred.');
        setIsProcessing(false);
        return;
      }

      // Transaction successful - create loan record
      const interestRate = parseFloat(request.interestRate || '5');
      const duration = parseInt(request.duration || '30');
      const principalAmount = parseFloat(request.amount);
      const interestAmount = principalAmount * (interestRate / 100);
      const totalRepayment = principalAmount + interestAmount;
      const dueDate = Date.now() + (duration * 24 * 60 * 60 * 1000);

      const borrowerAddress = request.borrowerAddress.toLowerCase();
      const lenderAddress = address.toLowerCase();
      
      const loanData = {
        borrowerAddress,
        lenderAddress,
        amount: request.amount,
        principalAmount: request.amount,
        interestRate: interestRate.toString(),
        duration: duration.toString(),
        totalRepayment: totalRepayment.toFixed(6),
        remainingAmount: totalRepayment.toFixed(6),
        dueDate,
        fundedAt: Date.now(),
        status: 'active',
        txHash: tx.hash,
        reason: request.reason || ''
      };

      // Store in borrows path under borrower's address
      const borrowsRef = dbRef(database, `borrows/${borrowerAddress}`);
      const newLoanRef = await push(borrowsRef, loanData);

      // Also store reference under lender's address
      const lenderLoansRef = dbRef(database, `lenderLoans/${lenderAddress}/${newLoanRef.key}`);
      await set(lenderLoansRef, {
        borrowerAddress,
        amount: request.amount,
        totalRepayment: totalRepayment.toFixed(6),
        dueDate,
        status: 'active'
      });

      // If this request is tied to a lending offer, update its status
      if (request.offerId) {
        const offerRef = dbRef(database, `lendingOffers/${request.offerId}`);
        await update(offerRef, {
          status: 'borrowed',
          borrower: borrowerAddress,
          borrowedAt: Date.now()
        });
      }

      // Send system messages to chat
      if (conversationId) {
        const messagesRef = dbRef(database, `messages/${conversationId}`);
        
        // Acceptance message
        await push(messagesRef, {
          senderId: 'system',
          type: 'system',
          text: `✅ Loan request accepted! Transaction successful!`,
          timestamp: Date.now(),
        });
        
        // Loan funded notification
        await push(messagesRef, {
          senderId: 'system',
          type: 'loan-funded',
          text: `🎉 Loan funded! ${request.amount} ETH has been sent.\n\nLoan Details:\n• Principal: ${request.amount} ETH\n• Interest: ${interestRate}%\n• Total Repayment: ${totalRepayment.toFixed(4)} ETH\n• Due: ${new Date(dueDate).toLocaleDateString()}\n\nPlease repay on time to maintain good credit.`,
          timestamp: Date.now(),
        });
      }

      // Success!
      if (onFundingComplete) {
        onFundingComplete();
      }
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Error funding loan:', err);
      setError(err.message || 'Failed to fund loan. Please try again.');
      setIsProcessing(false);
    }
  };

  const displayName = ensData.name || `${request.borrowerAddress?.slice(0, 6)}...${request.borrowerAddress?.slice(-4)}`;
  const interestAmount = (parseFloat(request.amount) * (parseFloat(request.interestRate) / 100)).toFixed(4);
  const totalRepayment = (parseFloat(request.amount) + parseFloat(interestAmount)).toFixed(4);

  return (
    <div className="inline-funding-modal-overlay" onClick={onClose}>
      <div className="inline-funding-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>💰 Fund Loan Request</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="funding-content">
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

          {/* Vault Balance Info */}
          <div className="vault-balance-info">
            <div className="balance-row">
              <span className="balance-label">💼 Your Vault Balance:</span>
              <span className={`balance-value ${parseFloat(vaultBalance) < parseFloat(request.amount) ? 'insufficient' : 'sufficient'}`}>
                {vaultBalance} ETH
              </span>
            </div>
            {parseFloat(vaultBalance) < parseFloat(request.amount) && (
              <p className="balance-warning">
                ⚠️ Insufficient balance. Deposit at least {(parseFloat(request.amount) - parseFloat(vaultBalance)).toFixed(4)} ETH more to your vault.
              </p>
            )}
          </div>

          <div className="loan-details">
            <div className="detail-row">
              <span className="detail-label">Amount to Fund</span>
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
              <div className="loan-reason">
                <span className="detail-label">Reason:</span>
                <p>{request.reason}</p>
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {txHash && (
            <div className="tx-info">
              <p>Transaction Hash:</p>
              <a 
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </a>
            </div>
          )}

          {!isProcessing ? (
            <div className="funding-actions">
              <button className="cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button className="fund-btn" onClick={handleFundClick}>
                💸 Fund {request.amount} ETH
              </button>
            </div>
          ) : (
            <div className="processing-state">
              <div className="spinner"></div>
              <p>{txHash ? 'Confirming transaction...' : 'Sending transaction...'}</p>
            </div>
          )}

          <p className="funding-note">
            💡 Funds will be sent from your vault to the borrower's wallet.
          </p>
        </div>
      </div>

      {/* Lender Verification Warning */}
      {showVerificationWarning && (
        <LenderVerificationWarning
          borrower={displayName}
          amount={request.amount}
          onAcknowledge={handleVerificationAcknowledged}
          onCancel={handleVerificationCancelled}
        />
      )}
    </div>
  );
};

export default InlineFundingModal;
