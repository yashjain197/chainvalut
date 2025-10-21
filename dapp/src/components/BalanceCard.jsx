import React, { useState, useEffect } from 'react';
import '../styles/BalanceCard.css';

const BalanceCard = ({ contract, balance, ethBalance, onUpdate }) => {
  const [ethUsdPrice, setEthUsdPrice] = useState(null);

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

  const balanceUsd = ethUsdPrice ? (parseFloat(balance) * ethUsdPrice).toFixed(2) : '---';

  return (
    <div className="balance-card">
      <div className="balance-header">
        <h2>Your Vault Balance</h2>
        <button className="refresh-button" onClick={onUpdate}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13.65 2.35C12.2 0.9 10.21 0 8 0 3.58 0 0.01 3.58 0.01 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-0.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14 0.69 4.22 1.78L9 7h7V0l-2.35 2.35z" fill="currentColor"/>
          </svg>
        </button>
      </div>
      
      <div className="balance-main">
        <div className="balance-value">
          <span className="balance-amount">{parseFloat(balance).toFixed(4)}</span>
          <span className="balance-currency">ETH</span>
        </div>
        <div className="balance-usd">
          ≈ ${balanceUsd} USD
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
  );
};

export default BalanceCard;
