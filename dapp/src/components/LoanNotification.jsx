import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import '../styles/LoanNotification.css';

export const LoanNotification = ({ userAddress }) => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userAddress) return;

    // Listen for active borrows that need repayment
    const borrowsRef = ref(database, `borrows/${userAddress}`);
    
    const unsubscribe = onValue(borrowsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const newNotifications = [];
      Object.entries(data).forEach(([loanId, loan]) => {
        if (loan.status === 'active') {
          const dueDate = new Date(loan.dueDate);
          const now = new Date();
          const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

          // Show notification if loan is due within 3 days or overdue
          if (daysUntilDue <= 3) {
            newNotifications.push({
              id: loanId,
              type: daysUntilDue < 0 ? 'overdue' : 'due-soon',
              title: daysUntilDue < 0 ? 'Loan Overdue!' : 'Loan Due Soon',
              message: `${loan.amount} ETH ${daysUntilDue < 0 ? 'overdue by' : 'due in'} ${Math.abs(daysUntilDue)} day(s)`,
              amount: loan.amount,
              interestRate: loan.interestRate,
              lenderAddress: loan.lenderAddress,
              conversationId: loan.conversationId,
              timestamp: Date.now()
            });
          }
        }
      });

      setNotifications(newNotifications);
    });

    return () => unsubscribe();
  }, [userAddress]);

  // Listen for received payments (when someone repays you)
  useEffect(() => {
    if (!userAddress) return;

    const offersRef = ref(database, 'lendingOffers');
    
    const unsubscribe = onValue(offersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const paymentNotifications = [];
      Object.entries(data).forEach(([offerId, offer]) => {
        if (offer.lenderAddress === userAddress && offer.status === 'repaid') {
          // Check if this is a recent repayment (within last 30 seconds)
          const lastUpdate = offer.updatedAt || offer.repaidAt;
          if (lastUpdate && Date.now() - lastUpdate < 30000) {
            paymentNotifications.push({
              id: `payment-${offerId}`,
              type: 'payment-received',
              title: 'Payment Received!',
              message: `${offer.borrowerAddress.slice(0, 6)}...${offer.borrowerAddress.slice(-4)} repaid ${offer.amount} ETH`,
              amount: offer.amount,
              borrowerAddress: offer.borrowerAddress,
              timestamp: lastUpdate
            });
          }
        }
      });

      if (paymentNotifications.length > 0) {
        setNotifications(prev => [...prev, ...paymentNotifications]);
        // Auto-dismiss payment notifications after 10 seconds
        setTimeout(() => {
          setNotifications(prev => 
            prev.filter(n => !paymentNotifications.some(pn => pn.id === n.id))
          );
        }, 10000);
      }
    });

    return () => unsubscribe();
  }, [userAddress]);

  const handleDismiss = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleAction = (notification) => {
    if (notification.type === 'overdue' || notification.type === 'due-soon') {
      // Navigate to chat with lender
      navigate(`/chat/${notification.conversationId}`, {
        state: { 
          loanId: notification.id,
          amount: notification.amount,
          interestRate: notification.interestRate,
          lenderAddress: notification.lenderAddress
        }
      });
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="loan-notifications">
      {notifications.map(notification => (
        <div 
          key={notification.id} 
          className={`loan-notification ${notification.type}`}
        >
          <div className="notification-icon">
            {notification.type === 'overdue' && '⚠️'}
            {notification.type === 'due-soon' && '⏰'}
            {notification.type === 'payment-received' && '✅'}
          </div>
          
          <div className="notification-content">
            <div className="notification-title">{notification.title}</div>
            <div className="notification-message">{notification.message}</div>
          </div>

          <div className="notification-actions">
            {(notification.type === 'overdue' || notification.type === 'due-soon') && (
              <button 
                className="notification-btn repay-btn"
                onClick={() => handleAction(notification)}
              >
                Repay
              </button>
            )}
            <button 
              className="notification-btn dismiss-btn"
              onClick={() => handleDismiss(notification.id)}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
