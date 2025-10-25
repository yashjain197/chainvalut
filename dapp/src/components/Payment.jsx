import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { database } from '../config/firebase';
import { ref, get, set } from 'firebase/database';
import { useENS } from '../hooks/useENS';
import UserAvatar from './UserAvatar';
import { sendAutoChatMessage } from '../utils/chatUtils';
import '../styles/Payment.css';

const Payment = () => {
  const { borrowId } = useParams();
  const location = useLocation();
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const [borrow, setBorrow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Check if this is a lender funding flow (from lending marketplace)
  const isLenderFlow = location.state?.mode === 'lend';
  const lendData = location.state?.lendData; // { borrowerAddress, amount, interestRate, duration, offerId }

  const recipientAddress = isLenderFlow ? lendData?.borrowerAddress : borrow?.lenderAddress;
  const ensData = useENS(recipientAddress);

  const { data: hash, sendTransaction } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Fetch borrow details (only for repayment flow)
  useEffect(() => {
    if (isLenderFlow) {
      // Skip fetching for lender flow, use passed data
      setLoading(false);
      return;
    }

    if (!isConnected || !address) {
      navigate('/profile');
      return;
    }

    const fetchBorrow = async () => {
      try {
        const borrowRef = ref(database, `borrows/${address.toLowerCase()}/${borrowId}`);
        const snapshot = await get(borrowRef);
        
        if (snapshot.exists()) {
          setBorrow(snapshot.val());
        } else {
          alert('Borrow not found');
          navigate('/profile');
        }
      } catch (error) {
        console.error('Error fetching borrow:', error);
        alert('Failed to load borrow details');
      } finally {
        setLoading(false);
      }
    };

    fetchBorrow();
  }, [address, borrowId, isConnected, navigate, isLenderFlow]);

  const handlePaymentConfirmed = async () => {
    try {
      if (isLenderFlow) {
        // Update lending offer to borrowed status
        const offerRef = ref(database, `lendingOffers/${lendData.offerId}`);
        const offerSnapshot = await get(offerRef);
        if (offerSnapshot.exists()) {
          await set(offerRef, {
            ...offerSnapshot.val(),
            status: 'borrowed',
            borrower: lendData.borrowerAddress,
            borrowedAt: Date.now(),
            transactionHash: hash,
          });
        }

        // Create borrow record for borrower
        const borrowRef = ref(database, `borrows/${lendData.borrowerAddress.toLowerCase()}/${lendData.offerId}`);
        const totalRepayment = parseFloat(lendData.amount) * (1 + lendData.interestRate / 100);
        const dueDate = Date.now() + (lendData.duration * 24 * 60 * 60 * 1000);
        
        await set(borrowRef, {
          offerId: lendData.offerId,
          lenderAddress: address.toLowerCase(),
          amount: lendData.amount,
          interestRate: lendData.interestRate,
          duration: lendData.duration,
          totalRepayment: totalRepayment,
          status: 'active',
          borrowedAt: Date.now(),
          dueDate: dueDate,
          transactionHash: hash,
        });

        // Send automatic chat message to borrower
        try {
          await sendAutoChatMessage(
            address, // Lender
            lendData.borrowerAddress, // Borrower
            'loan-funded',
            {
              amount: lendData.amount,
              interestRate: lendData.interestRate,
              duration: lendData.duration,
              txHash: hash,
            }
          );
          console.log('✅ Loan funded notification sent to borrower');
        } catch (chatError) {
          console.error('Failed to send chat notification:', chatError);
          // Don't fail the whole transaction if chat fails
        }

        alert('Payment successful! Borrower will be notified.');
        navigate('/lending-marketplace');
      } else {
        // Update borrow status (repayment flow)
        const borrowRef = ref(database, `borrows/${address.toLowerCase()}/${borrowId}`);
        await set(borrowRef, {
          ...borrow,
          status: 'repaid',
          repaidAt: Date.now(),
          transactionHash: hash,
        });

        // Update offer status
        const offerRef = ref(database, `lendingOffers/${borrow.offerId}`);
        const offerSnapshot = await get(offerRef);
        if (offerSnapshot.exists()) {
          await set(offerRef, {
            ...offerSnapshot.val(),
            status: 'repaid',
            repaidAt: Date.now(),
          });
        }

        // Send automatic chat message to lender
        try {
          const repaymentAmount = borrow.totalRepayment || borrow.amount;
          await sendAutoChatMessage(
            address, // Borrower
            borrow.lenderAddress, // Lender
            'loan-repaid',
            {
              amount: repaymentAmount,
              txHash: hash,
            }
          );
          console.log('✅ Repayment notification sent to lender');
        } catch (chatError) {
          console.error('Failed to send chat notification:', chatError);
          // Don't fail the whole transaction if chat fails
        }

        alert('Payment successful! Your borrow has been marked as repaid.');
        navigate('/profile');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Payment was sent but failed to update status. Please contact support.');
    }
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      handlePaymentConfirmed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed, hash]);

  const handlePayment = async () => {
    if (!sendTransaction) return;

    setProcessing(true);
    try {
      const amount = isLenderFlow ? lendData.amount : borrow.totalRepayment.toString();
      sendTransaction({
        to: recipientAddress,
        value: parseEther(amount),
      });
    } catch (error) {
      console.error('Error sending payment:', error);
      alert('Failed to send payment. Please try again.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="payment-container">
        <div className="payment-loading">
          <div className="spinner"></div>
          <p>Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!isLenderFlow && !borrow) {
    return (
      <div className="payment-container">
        <div className="payment-empty">
          <h3>Borrow not found</h3>
          <button onClick={() => navigate('/profile')} className="back-btn">
            Return to Profile
          </button>
        </div>
      </div>
    );
  }

  if (isLenderFlow) {
    // Lender funding flow UI
    const totalRepayment = parseFloat(lendData.amount) * (1 + lendData.interestRate / 100);
    const interest = totalRepayment - parseFloat(lendData.amount);

    return (
      <div className="payment-container">
        <div className="payment-card">
          <div className="payment-header">
            <h1>Fund Loan</h1>
            <button onClick={() => navigate('/lending-marketplace')} className="back-link">
              ← Back to Marketplace
            </button>
          </div>

          <div className="lender-info-section">
            <h3>Borrower Information</h3>
            <div className="lender-details">
              <UserAvatar
                address={lendData.borrowerAddress}
                ensAvatar={ensData.avatar}
                ensName={ensData.name}
                size={48}
              />
              <div>
                <div className="lender-name">
                  {ensData.name || `${lendData.borrowerAddress.slice(0, 10)}...${lendData.borrowerAddress.slice(-8)}`}
                </div>
                <div className="lender-address">{lendData.borrowerAddress}</div>
              </div>
            </div>
          </div>

          <div className="payment-details">
            <h3>Loan Details</h3>
            
            <div className="detail-row">
              <span className="detail-label">Lending Amount</span>
              <span className="detail-value">{lendData.amount} ETH</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Interest Rate</span>
              <span className="detail-value">{lendData.interestRate}%</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Duration</span>
              <span className="detail-value">{lendData.duration} days</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Expected Interest</span>
              <span className="detail-value earning">+{interest.toFixed(4)} ETH</span>
            </div>

            <div className="detail-row total-row">
              <span className="detail-label">Total Expected Repayment</span>
              <span className="detail-value total">{totalRepayment.toFixed(4)} ETH</span>
            </div>
          </div>

          <div className="payment-action">
            <button
              className="pay-btn"
              onClick={handlePayment}
              disabled={processing || isConfirming || isConfirmed}
            >
              {isConfirming ? (
                <>
                  <div className="spinner-small"></div>
                  Confirming Transaction...
                </>
              ) : isConfirmed ? (
                <>
                  ✓ Payment Successful
                </>
              ) : processing ? (
                <>
                  <div className="spinner-small"></div>
                  Processing...
                </>
              ) : (
                `Lend ${lendData.amount} ETH`
              )}
            </button>

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
          </div>

          <div className="payment-warning">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 12H7v-2h2v2zm0-3H7V4h2v5z"/>
            </svg>
            <p>This will send {lendData.amount} ETH to the borrower. You will earn {interest.toFixed(4)} ETH in interest when repaid. Make sure you trust the borrower!</p>
          </div>
        </div>
      </div>
    );
  }

  // Borrower repayment flow UI (original code)

  const daysRemaining = Math.ceil((borrow.dueDate - Date.now()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysRemaining < 0;

  return (
    <div className="payment-container">
      <div className="payment-card">
        <div className="payment-header">
          <h1>Repay Loan</h1>
          <button onClick={() => navigate('/profile')} className="back-link">
            ← Back to Profile
          </button>
        </div>

        <div className="lender-info-section">
          <h3>Lender Information</h3>
          <div className="lender-details">
            <UserAvatar
              address={borrow.lenderAddress}
              ensAvatar={ensData.avatar}
              ensName={ensData.name}
              size={48}
            />
            <div>
              <div className="lender-name">
                {ensData.name || `${borrow.lenderAddress.slice(0, 10)}...${borrow.lenderAddress.slice(-8)}`}
              </div>
              <div className="lender-address">{borrow.lenderAddress}</div>
            </div>
          </div>
        </div>

        <div className="payment-details">
          <h3>Payment Details</h3>
          
          <div className="detail-row">
            <span className="detail-label">Original Amount</span>
            <span className="detail-value">{borrow.amount} ETH</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Interest Rate</span>
            <span className="detail-value">{borrow.interestRate}%</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Duration</span>
            <span className="detail-value">{borrow.duration} days</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Borrowed On</span>
            <span className="detail-value">
              {new Date(borrow.borrowedAt).toLocaleDateString()}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Due Date</span>
            <span className={`detail-value ${isOverdue ? 'overdue' : ''}`}>
              {new Date(borrow.dueDate).toLocaleDateString()}
              {isOverdue ? ' (OVERDUE)' : ` (${daysRemaining} days remaining)`}
            </span>
          </div>

          <div className="detail-row total-row">
            <span className="detail-label">Total Repayment</span>
            <span className="detail-value total">{parseFloat(borrow.totalRepayment || 0).toFixed(4)} ETH</span>
          </div>
        </div>

        {isOverdue && (
          <div className="overdue-warning">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15H9v-2h2v2zm0-4H9V5h2v6z"/>
            </svg>
            This loan is overdue! Please repay as soon as possible.
          </div>
        )}

        <div className="payment-action">
          <button
            className="pay-btn"
            onClick={handlePayment}
            disabled={processing || isConfirming || isConfirmed}
          >
            {isConfirming ? (
              <>
                <div className="spinner-small"></div>
                Confirming Transaction...
              </>
            ) : isConfirmed ? (
              <>
                ✓ Payment Successful
              </>
            ) : processing ? (
              <>
                <div className="spinner-small"></div>
                Processing...
              </>
            ) : (
              `Pay ${parseFloat(borrow.totalRepayment || 0).toFixed(4)} ETH`
            )}
          </button>

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
        </div>

        <div className="payment-warning">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 12H7v-2h2v2zm0-3H7V4h2v5z"/>
          </svg>
          <p>This will send {parseFloat(borrow.totalRepayment || 0).toFixed(4)} ETH to the lender's address. Make sure you have sufficient balance plus gas fees.</p>
        </div>
      </div>
    </div>
  );
};

export default Payment;
