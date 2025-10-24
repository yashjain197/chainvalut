import React, { useState, useEffect } from 'react';
import '../styles/BalanceCard.css';

const BalanceCard = ({ contract, balance, ethBalance, onUpdate }) => {
  const [ethUsdPrice, setEthUsdPrice] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Debug: Log received props
  useEffect(() => {
    console.log('BalanceCard received props:', {
      hasContract: !!contract,
      balance: balance,
      ethBalance: ethBalance,
      balanceType: typeof balance,
      ethBalanceType: typeof ethBalance
    });
  }, [contract, balance, ethBalance]);

  useEffect(() => {
    const fetchEthPrice = async () => {
      if (!contract) return;
      
      try {
        const [price, decimals] = await contract.getLatestEthUsd();
        const priceInUsd = Number(price) / Math.pow(10, Number(decimals));
        setEthUsdPrice(priceInUsd);
      } catch (err) {
        console.error('Error fetching ETH price:', err);
      }
    };

    fetchEthPrice();
    const interval = setInterval(fetchEthPrice, 30000); // Update every 30s

    return () => clearInterval(interval);
  }, [contract]);

  // Trigger initial balance update on mount
  useEffect(() => {
    if (contract && onUpdate) {
      console.log('BalanceCard mounted, triggering initial balance update');
      onUpdate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract]); // Only run when contract becomes available

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onUpdate();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const balanceUsd = ethUsdPrice ? (parseFloat(balance) * ethUsdPrice).toFixed(2) : '---';

  return (
    <div className="balance-card">
      <div className="balance-header">
        <h2>Your Balance</h2>
        <button 
          className={`refresh-button ${isRefreshing ? 'spinning' : ''}`} 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13.65 2.35C12.2 0.9 10.21 0 8 0 3.58 0 0.01 3.58 0.01 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-0.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14 0.69 4.22 1.78L9 7h7V0l-2.35 2.35z" fill="currentColor"/>
          </svg>
        </button>
      </div>
      
      <div className="balance-main">
        <div>
          <div className="balance-value">
            <span className="balance-amount">{parseFloat(balance).toFixed(4)}</span>
            <span className="balance-currency">ETH</span>
          </div>
          <div className="balance-usd">
            Vault: ${balanceUsd} USD
          </div>
        </div>

        <div className="balance-details">
          <div className="detail-item">
            <span className="detail-label">Wallet Balance</span>
            <span className="detail-value">{parseFloat(ethBalance).toFixed(4)} ETH</span>
          </div>
          {ethUsdPrice && (
            <div className="detail-item">
              <span className="detail-label">ETH Price</span>
              <span className="detail-value">${ethUsdPrice.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
