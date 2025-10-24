import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { database } from '../config/firebase';
import { ref, onValue } from 'firebase/database';
import '../styles/LendingStats.css';

const LendingStats = () => {
  const { address, isConnected } = useAccount();
  const [stats, setStats] = useState({
    totalLent: 0,
    totalBorrowed: 0,
    activeLoans: 0,
    activeBorrows: 0,
    totalInterestEarned: 0,
    totalInterestPaying: 0,
  });

  useEffect(() => {
    if (!isConnected || !address) return;

    const addressLower = address.toLowerCase();

    // Fetch lending offers where user is lender
    const offersRef = ref(database, 'lendingOffers');
    const unsubscribeOffers = onValue(offersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const myOffers = Object.values(data).filter(
          offer => offer.lenderAddress === addressLower
        );
        
        const borrowed = myOffers.filter(o => o.status === 'borrowed');
        const totalLent = borrowed.reduce((sum, o) => sum + parseFloat(o.amount), 0);
        const totalInterestEarned = borrowed.reduce((sum, o) => {
          const interest = parseFloat(o.amount) * (o.interestRate / 100);
          return sum + interest;
        }, 0);

        setStats(prev => ({
          ...prev,
          activeLoans: borrowed.length,
          totalLent: totalLent,
          totalInterestEarned: totalInterestEarned,
        }));
      }
    });

    // Fetch user's borrows
    const borrowsRef = ref(database, `borrows/${addressLower}`);
    const unsubscribeBorrows = onValue(borrowsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const borrows = Object.values(data);
        const active = borrows.filter(b => b.status === 'active');
        const totalBorrowed = active.reduce((sum, b) => sum + parseFloat(b.amount), 0);
        const totalInterestPaying = active.reduce((sum, b) => {
          const interest = parseFloat(b.amount) * (b.interestRate / 100);
          return sum + interest;
        }, 0);

        setStats(prev => ({
          ...prev,
          activeBorrows: active.length,
          totalBorrowed: totalBorrowed,
          totalInterestPaying: totalInterestPaying,
        }));
      }
    });

    return () => {
      unsubscribeOffers();
      unsubscribeBorrows();
    };
  }, [address, isConnected]);

  if (!isConnected) return null;

  return (
    <div className="lending-stats">
      <h2>P2P Lending Stats</h2>
      
      <div className="stats-grid">
        <div className="stat-card lend">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 10 12 6.16-1.26 10-6.45 10-12V7l-10-5z" fill="currentColor" opacity="0.2"/>
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 10 12 6.16-1.26 10-6.45 10-12V7l-10-5zm0 2.18l8 3.6v8.55c0 4.45-3.08 8.63-8 9.65V4.18z" fill="currentColor"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Lent</div>
            <div className="stat-value">{stats.totalLent.toFixed(4)} ETH</div>
            <div className="stat-meta">{stats.activeLoans} active loan{stats.activeLoans !== 1 ? 's' : ''}</div>
          </div>
        </div>

        <div className="stat-card borrow">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" fill="currentColor" opacity="0.2"/>
              <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z" fill="currentColor"/>
              <path d="M11 7h2v6h-2zM11 15h2v2h-2z" fill="currentColor"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Borrowed</div>
            <div className="stat-value">{stats.totalBorrowed.toFixed(4)} ETH</div>
            <div className="stat-meta">{stats.activeBorrows} active borrow{stats.activeBorrows !== 1 ? 's' : ''}</div>
          </div>
        </div>

        <div className="stat-card interest-earn">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M12 7v5l3 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Interest Earning</div>
            <div className="stat-value earning">+{stats.totalInterestEarned.toFixed(4)} ETH</div>
            <div className="stat-meta">From active loans</div>
          </div>
        </div>

        <div className="stat-card interest-pay">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Interest Paying</div>
            <div className="stat-value paying">-{stats.totalInterestPaying.toFixed(4)} ETH</div>
            <div className="stat-meta">On active borrows</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LendingStats;
