import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { database } from '../config/firebase';
import { ref, onValue } from 'firebase/database';
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useNavigate } from 'react-router-dom';
import UserAvatar from './UserAvatar';
import { useENS } from '../hooks/useENS';
import '../styles/LoanStats.css';

const LoanStats = ({ balance }) => {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const [borrows, setBorrows] = useState([]);
  const [lends, setLends] = useState([]);
  const [payingBorrowId, setPayingBorrowId] = useState(null);

  const { data: hash, sendTransaction } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Fetch user's borrows
  useEffect(() => {
    if (!isConnected || !address) return;

    const borrowsRef = ref(database, `borrows/${address.toLowerCase()}`);
    const unsubscribe = onValue(borrowsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const borrowsArray = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter(b => b.status === 'active')
          .sort((a, b) => b.borrowedAt - a.borrowedAt);
        setBorrows(borrowsArray);
      } else {
        setBorrows([]);
      }
    });

    return () => unsubscribe();
  }, [address, isConnected]);

  // Fetch user's lends (offers where they are lender and status is borrowed)
  useEffect(() => {
    if (!isConnected || !address) return;

    const offersRef = ref(database, 'lendingOffers');
    const unsubscribe = onValue(offersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lendsArray = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter(o => 
            o.lenderAddress?.toLowerCase() === address.toLowerCase() && 
            o.status === 'borrowed'
          )
          .sort((a, b) => b.borrowedAt - a.borrowedAt);
        setLends(lendsArray);
      } else {
        setLends([]);
      }
    });

    return () => unsubscribe();
  }, [address, isConnected]);

  // Calculate totals
  const totalBorrowed = borrows.reduce((sum, b) => sum + parseFloat(b.amount), 0);
  const totalOwed = borrows.reduce((sum, b) => sum + parseFloat(b.totalRepayment), 0);
  const totalLent = lends.reduce((sum, l) => sum + parseFloat(l.amount), 0);
  const totalExpectedReturn = lends.reduce((sum, l) => {
    const interest = parseFloat(l.amount) * (l.interestRate / 100);
    return sum + parseFloat(l.amount) + interest;
  }, 0);

  const handleQuickPay = async (borrow) => {
    setPayingBorrowId(borrow.id);
    const repaymentAmount = borrow.totalRepayment;
    const vaultBalance = parseFloat(balance);

    // Check if vault has sufficient balance
    if (vaultBalance >= repaymentAmount) {
      // Redirect to payment page with vault flag
      navigate(`/payment/${borrow.id}`, { state: { useVault: true } });
    } else {
      // Use wallet directly
      try {
        sendTransaction({
          to: borrow.lenderAddress,
          value: parseEther(repaymentAmount.toString()),
        });
      } catch (error) {
        console.error('Error sending payment:', error);
        setPayingBorrowId(null);
      }
    }
  };

  useEffect(() => {
    if (isConfirmed && payingBorrowId) {
      alert('Payment successful!');
      setPayingBorrowId(null);
    }
  }, [isConfirmed, payingBorrowId]);

  if (!isConnected) return null;

  return (
    <div className="loan-stats">
      <h2>Lending & Borrowing</h2>

      {/* Summary Cards */}
      <div className="stats-summary">
        <div className="summary-card borrow">
          <div className="summary-icon">💸</div>
          <div className="summary-content">
            <div className="summary-label">Total Borrowed</div>
            <div className="summary-value">{totalBorrowed.toFixed(4)} ETH</div>
            <div className="summary-meta">{borrows.length} active loan{borrows.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        <div className="summary-card owed">
          <div className="summary-icon">⚠️</div>
          <div className="summary-content">
            <div className="summary-label">Total Owed</div>
            <div className="summary-value">{totalOwed.toFixed(4)} ETH</div>
            <div className="summary-meta">Including interest</div>
          </div>
        </div>

        <div className="summary-card lend">
          <div className="summary-icon">🏦</div>
          <div className="summary-content">
            <div className="summary-label">Total Lent</div>
            <div className="summary-value">{totalLent.toFixed(4)} ETH</div>
            <div className="summary-meta">{lends.length} active loan{lends.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        <div className="summary-card returns">
          <div className="summary-icon">💰</div>
          <div className="summary-content">
            <div className="summary-label">Expected Returns</div>
            <div className="summary-value earning">{totalExpectedReturn.toFixed(4)} ETH</div>
            <div className="summary-meta">When repaid</div>
          </div>
        </div>
      </div>

      {/* Active Borrows */}
      {borrows.length > 0 && (
        <div className="loans-section">
          <h3>My Active Borrows</h3>
          <div className="loans-list">
            {borrows.map((borrow) => (
              <BorrowItem 
                key={borrow.id} 
                borrow={borrow} 
                onQuickPay={handleQuickPay}
                isPaying={payingBorrowId === borrow.id}
                isConfirming={isConfirming}
                vaultBalance={parseFloat(balance)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active Lends */}
      {lends.length > 0 && (
        <div className="loans-section">
          <h3>My Active Lends</h3>
          <div className="loans-list">
            {lends.map((lend) => (
              <LendItem key={lend.id} lend={lend} />
            ))}
          </div>
        </div>
      )}

      {borrows.length === 0 && lends.length === 0 && (
        <div className="no-loans">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
            <path d="M24 14v20M14 24h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>No active loans or borrows</p>
        </div>
      )}
    </div>
  );
};

const BorrowItem = ({ borrow, onQuickPay, isPaying, isConfirming, vaultBalance }) => {
  const ensData = useENS(borrow.lenderAddress);
  const daysRemaining = Math.ceil((borrow.dueDate - Date.now()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysRemaining < 0;
  const canPayFromVault = vaultBalance >= borrow.totalRepayment;

  return (
    <div className={`loan-item ${isOverdue ? 'overdue' : ''}`}>
      <div className="loan-header">
        <div className="loan-party">
          <UserAvatar
            address={borrow.lenderAddress}
            ensAvatar={ensData.avatar}
            ensName={ensData.name}
            size={32}
          />
          <div>
            <div className="party-label">Lender</div>
            <div className="party-name">
              {ensData.name || `${borrow.lenderAddress.slice(0, 6)}...${borrow.lenderAddress.slice(-4)}`}
            </div>
          </div>
        </div>
        {isOverdue && <div className="overdue-badge">OVERDUE</div>}
      </div>

      <div className="loan-details">
        <div className="detail-row">
          <span>Borrowed</span>
          <span className="detail-value">{borrow.amount} ETH</span>
        </div>
        <div className="detail-row">
          <span>Interest Rate</span>
          <span className="detail-value">{borrow.interestRate}%</span>
        </div>
        <div className="detail-row">
          <span>Total to Repay</span>
          <span className="detail-value highlight">{parseFloat(borrow.totalRepayment || 0).toFixed(4)} ETH</span>
        </div>
        <div className="detail-row">
          <span>Due Date</span>
          <span className={isOverdue ? 'overdue-text' : ''}>
            {new Date(borrow.dueDate).toLocaleDateString()}
            {isOverdue ? ` (${Math.abs(daysRemaining)}d overdue)` : ` (${daysRemaining}d left)`}
          </span>
        </div>
      </div>

      <button 
        className={`quick-pay-btn ${canPayFromVault ? 'vault' : 'wallet'}`}
        onClick={() => onQuickPay(borrow)}
        disabled={isPaying || isConfirming}
      >
        {isPaying || isConfirming ? (
          <>
            <div className="spinner-small"></div>
            {isConfirming ? 'Confirming...' : 'Processing...'}
          </>
        ) : (
          <>
            {canPayFromVault ? (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0L1 4v6c0 4.33 2.99 8.38 7 9.38 4.01-1 7-5.05 7-9.38V4L8 0z"/>
                </svg>
                Quick Pay from Vault
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM7 11V5h2v6H7z"/>
                </svg>
                Pay from Wallet
              </>
            )}
          </>
        )}
      </button>
    </div>
  );
};

const LendItem = ({ lend }) => {
  const ensData = useENS(lend.borrower);
  const dueDate = lend.borrowedAt + (lend.duration * 24 * 60 * 60 * 1000);
  const daysRemaining = Math.ceil((dueDate - Date.now()) / (1000 * 60 * 60 * 24));
  const expectedInterest = parseFloat(lend.amount) * (lend.interestRate / 100);

  return (
    <div className="loan-item lend">
      <div className="loan-header">
        <div className="loan-party">
          <UserAvatar
            address={lend.borrower}
            ensAvatar={ensData.avatar}
            ensName={ensData.name}
            size={32}
          />
          <div>
            <div className="party-label">Borrower</div>
            <div className="party-name">
              {ensData.name || `${lend.borrower.slice(0, 6)}...${lend.borrower.slice(-4)}`}
            </div>
          </div>
        </div>
        <div className="active-badge">ACTIVE</div>
      </div>

      <div className="loan-details">
        <div className="detail-row">
          <span>Lent Amount</span>
          <span className="detail-value">{lend.amount} ETH</span>
        </div>
        <div className="detail-row">
          <span>Interest Rate</span>
          <span className="detail-value">{lend.interestRate}%</span>
        </div>
        <div className="detail-row">
          <span>Expected Interest</span>
          <span className="detail-value earning">+{expectedInterest.toFixed(4)} ETH</span>
        </div>
        <div className="detail-row">
          <span>Expected Repayment</span>
          <span className="detail-value highlight">{(parseFloat(lend.amount) + expectedInterest).toFixed(4)} ETH</span>
        </div>
        <div className="detail-row">
          <span>Due Date</span>
          <span>
            {new Date(dueDate).toLocaleDateString()} ({daysRemaining}d left)
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoanStats;
