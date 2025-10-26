import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { usePublicClient, useAccount, useChainId } from 'wagmi';
import { normalize } from 'viem/ens';
import { database } from '../config/firebase';
import { ref as dbRef, push, set, get } from 'firebase/database';
import { buildExplorerLink } from '../utils/blockscout';
import TransactionDetailsModal from './TransactionDetailsModal';
import '../styles/ActionPanel.css';

const ActionPanel = ({ contract, onTransactionComplete, borrowRequestToFund, onFundingComplete, repaymentLoan, onRepaymentComplete }) => {
  const [activeTab, setActiveTab] = useState('deposit');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [payAddress, setPayAddress] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [txStatus, setTxStatus] = useState(''); // 'pending', 'confirming', 'success'
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [resolvingENS, setResolvingENS] = useState(false);
  const [showTxDetails, setShowTxDetails] = useState(false);
  const publicClient = usePublicClient();
  const { address: currentAddress } = useAccount();
  const chainId = useChainId();

  // Auto-switch to Pay tab and populate when there's a borrow request to fund
  useEffect(() => {
    if (borrowRequestToFund) {
      setActiveTab('pay');
      setPayAddress(borrowRequestToFund.borrowerAddress || borrowRequestToFund.from);
      setPayAmount(borrowRequestToFund.amount);
    }
  }, [borrowRequestToFund]);

  // Auto-switch to Pay tab and populate when there's a loan to repay
  useEffect(() => {
    if (repaymentLoan) {
      setActiveTab('pay');
      setPayAddress(repaymentLoan.lenderAddress);
      setPayAmount(repaymentLoan.installmentAmount || repaymentLoan.totalRepayment || repaymentLoan.remainingAmount);
    }
  }, [repaymentLoan]);

  const generateRef = () => {
    return ethers.hexlify(ethers.randomBytes(32));
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setTxHash('');
      setTxStatus('pending');

      const value = ethers.parseEther(depositAmount);
      const ref = generateRef();
      
      console.log('Sending deposit transaction...');
      const tx = await contract.deposit(ref, { value });
      setTxHash(tx.hash);
      setTxStatus('confirming');
      console.log('Transaction sent, waiting for confirmation:', tx.hash);
      
      await tx.wait(1); // Wait for 1 confirmation
      console.log('Transaction confirmed!');
      setTxStatus('success');
      
      setDepositAmount('');
      onTransactionComplete();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setTxHash('');
        setTxStatus('');
      }, 5000);
    } catch (err) {
      console.error('Deposit error:', err);
      setError(err.reason || err.message || 'Transaction failed');
      setTxStatus('');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!withdrawAddress || !ethers.isAddress(withdrawAddress)) {
      setError('Please enter a valid address');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setTxHash('');
      setTxStatus('pending');

      const amount = ethers.parseEther(withdrawAmount);
      const ref = generateRef();
      
      const tx = await contract.withdraw(amount, withdrawAddress, ref);
      setTxHash(tx.hash);
      setTxStatus('confirming');
      
      await tx.wait(1);
      setTxStatus('success');
      
      setWithdrawAmount('');
      setWithdrawAddress('');
      onTransactionComplete();
      
      setTimeout(() => {
        setTxHash('');
        setTxStatus('');
      }, 5000);
    } catch (err) {
      console.error('Withdraw error:', err);
      setError(err.reason || err.message || 'Transaction failed');
      setTxStatus('');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawAll = async () => {
    try {
      setLoading(true);
      setError('');
      setTxHash('');
      setTxStatus('pending');

      const ref = generateRef();
      const tx = await contract.withdrawAll(ref);
      setTxHash(tx.hash);
      setTxStatus('confirming');
      
      await tx.wait(1);
      setTxStatus('success');
      
      onTransactionComplete();
      
      setTimeout(() => {
        setTxHash('');
        setTxStatus('');
      }, 5000);
    } catch (err) {
      console.error('Withdraw all error:', err);
      setError(err.reason || err.message || 'Transaction failed');
      setTxStatus('');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!payAddress) {
      setError('Please enter an address or ENS name');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setTxHash('');
      setTxStatus('pending');

      let targetAddress = payAddress;

      // Check if it's an ENS name (ends with .eth)
      if (payAddress.endsWith('.eth')) {
        setResolvingENS(true);
        try {
          const ensAddress = await publicClient.getEnsAddress({
            name: normalize(payAddress),
          });
          
          if (!ensAddress) {
            setError(`ENS name "${payAddress}" not found. Please check the spelling or use a regular address.`);
            setLoading(false);
            setResolvingENS(false);
            setTxStatus('');
            return;
          }
          
          targetAddress = ensAddress;
          setResolvedAddress(ensAddress);
        } catch (ensError) {
          console.error('ENS resolution error:', ensError);
          setError(`Could not resolve "${payAddress}". Please use a regular Ethereum address (0x...) instead.`);
          setLoading(false);
          setResolvingENS(false);
          setTxStatus('');
          return;
        } finally {
          setResolvingENS(false);
        }
      } else if (!ethers.isAddress(payAddress)) {
        setError('Please enter a valid address or ENS name (.eth)');
        setLoading(false);
        setTxStatus('');
        return;
      }

      const amount = ethers.parseEther(payAmount);
      const ref = generateRef();
      
      const tx = await contract.pay(targetAddress, amount, ref);
      setTxHash(tx.hash);
      setTxStatus('confirming');
      
      const receipt = await tx.wait(1);
      
      // Check if transaction was successful
      if (receipt.status !== 1) {
        setError('Transaction failed. No funds were transferred.');
        setTxStatus('');
        setLoading(false);
        return;
      }
      
      setTxStatus('success');

      // If this is a loan funding from a borrow request, create the loan record
      if (borrowRequestToFund) {
        try {
          const interestRate = parseFloat(borrowRequestToFund.interestRate || '5');
          const duration = parseInt(borrowRequestToFund.duration || '30');
          const principalAmount = parseFloat(payAmount);
          const interestAmount = principalAmount * (interestRate / 100);
          const totalRepayment = principalAmount + interestAmount;
          const dueDate = Date.now() + (duration * 24 * 60 * 60 * 1000);

          // Create loan record in Firebase
          const borrowerAddress = targetAddress.toLowerCase();
          const lenderAddress = currentAddress.toLowerCase();
          
          const loanData = {
            borrowerAddress,
            lenderAddress,
            amount: payAmount,
            principalAmount: payAmount,
            interestRate: interestRate.toString(),
            duration: duration.toString(),
            totalRepayment: totalRepayment.toFixed(6),
            remainingAmount: totalRepayment.toFixed(6),
            dueDate,
            fundedAt: Date.now(),
            status: 'active',
            txHash: tx.hash,
            reason: borrowRequestToFund.reason || ''
          };

          // Store in borrows path under borrower's address
          const borrowsRef = dbRef(database, `borrows/${borrowerAddress}`);
          const newLoanRef = await push(borrowsRef, loanData);

          // Also store reference under lender's address
          const lenderLoansRef = dbRef(database, `lenderLoans/${lenderAddress}/${newLoanRef.key}`);
          await set(lenderLoansRef, {
            borrowerAddress,
            amount: payAmount,
            totalRepayment: totalRepayment.toFixed(6),
            dueDate,
            status: 'active'
          });

          // Send system message to notify borrower that loan is funded
          // Find the conversation between lender and borrower
          const conversationsRef = dbRef(database, 'conversations');
          const conversationsSnapshot = await get(conversationsRef);
          if (conversationsSnapshot.exists()) {
            const conversations = conversationsSnapshot.val();
            const convoId = Object.keys(conversations).find(key => {
              const convo = conversations[key];
              return convo.participants?.includes(lenderAddress) && 
                     convo.participants?.includes(borrowerAddress);
            });
            
            if (convoId) {
              const messagesRef = dbRef(database, `messages/${convoId}`);
              
              // First, send acceptance message
              await push(messagesRef, {
                senderId: 'system',
                type: 'system',
                text: `✅ Accepted borrow request for ${payAmount} ETH. Transaction successful!`,
                timestamp: Date.now(),
              });
              
              // Then send loan funded notification
              await push(messagesRef, {
                senderId: 'system',
                type: 'loan-funded',
                text: `🎉 Loan funded! ${payAmount} ETH has been sent.\n\nLoan Details:\n• Principal: ${payAmount} ETH\n• Interest: ${interestRate}%\n• Total Repayment: ${totalRepayment.toFixed(4)} ETH\n• Due: ${new Date(dueDate).toLocaleDateString()}\n\nPlease repay on time to maintain good credit.`,
                timestamp: Date.now(),
              });
            }
          }

          console.log('Loan record created:', newLoanRef.key);
          
          // Call the callback to clear the funding state
          if (onFundingComplete) {
            onFundingComplete();
          }
        } catch (firebaseError) {
          console.error('Error creating loan record:', firebaseError);
          // Don't fail the whole transaction, just log the error
        }
      }

      // If this is a loan repayment, update the loan status and send notification
      if (repaymentLoan) {
        try {
          const isFullRepayment = !repaymentLoan.installmentAmount;
          const paidAmount = parseFloat(payAmount);
          const borrowerAddress = currentAddress.toLowerCase();
          const lenderAddress = targetAddress.toLowerCase();

          // Update loan record
          const loanRef = dbRef(database, `borrows/${borrowerAddress}/${repaymentLoan.id}`);
          const loanSnapshot = await get(loanRef);
          
          if (loanSnapshot.exists()) {
            const currentLoan = loanSnapshot.val();
            const remainingAmount = parseFloat(currentLoan.remainingAmount || currentLoan.totalRepayment);
            const newRemainingAmount = Math.max(0, remainingAmount - paidAmount);
            const isComplete = newRemainingAmount === 0 || isFullRepayment;

            await set(loanRef, {
              ...currentLoan,
              remainingAmount: newRemainingAmount.toFixed(6),
              status: isComplete ? 'repaid' : 'active',
              repaidAt: isComplete ? Date.now() : currentLoan.repaidAt,
              lastPaymentAt: Date.now(),
              lastPaymentTxHash: tx.hash,
              paidInstallments: [
                ...(currentLoan.paidInstallments || []),
                {
                  amount: payAmount,
                  txHash: tx.hash,
                  timestamp: Date.now()
                }
              ]
            });

            // Update lender's reference
            const lenderLoanRef = dbRef(database, `lenderLoans/${lenderAddress}/${repaymentLoan.id}`);
            await set(lenderLoanRef, {
              borrowerAddress,
              amount: currentLoan.amount,
              totalRepayment: currentLoan.totalRepayment,
              dueDate: currentLoan.dueDate,
              status: isComplete ? 'repaid' : 'active'
            });

            // Send system message
            const conversationsRef = dbRef(database, 'conversations');
            const conversationsSnapshot = await get(conversationsRef);
            if (conversationsSnapshot.exists()) {
              const conversations = conversationsSnapshot.val();
              const convoId = Object.keys(conversations).find(key => {
                const convo = conversations[key];
                return convo.participants?.includes(lenderAddress) && 
                       convo.participants?.includes(borrowerAddress);
              });
              
              if (convoId) {
                const messagesRef = dbRef(database, `messages/${convoId}`);
                if (isComplete) {
                  await push(messagesRef, {
                    senderId: 'system',
                    type: 'loan-repaid',
                    text: `✅ Loan fully repaid! ${payAmount} ETH payment received.\n\nLoan completed successfully. Thank you for maintaining good credit! 🎉`,
                    timestamp: Date.now(),
                  });
                } else {
                  await push(messagesRef, {
                    senderId: 'system',
                    type: 'installment-paid',
                    text: `💰 Installment payment received: ${payAmount} ETH\n\nRemaining balance: ${newRemainingAmount.toFixed(4)} ETH`,
                    timestamp: Date.now(),
                  });
                }
              }
            }
          }

          console.log('Loan repayment processed');
          
          // Call the callback to clear the repayment state
          if (onRepaymentComplete) {
            onRepaymentComplete();
          }
        } catch (firebaseError) {
          console.error('Error processing repayment:', firebaseError);
          // Don't fail the whole transaction, just log the error
        }
      }
      
      setPayAmount('');
      setPayAddress('');
      setResolvedAddress('');
      onTransactionComplete();
      
      setTimeout(() => {
        setTxHash('');
        setTxStatus('');
      }, 5000);
    } catch (err) {
      console.error('Pay error:', err);
      setError(err.reason || err.message || 'Transaction failed');
      setTxStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="action-panel">
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'deposit' ? 'active' : ''}`}
          onClick={() => setActiveTab('deposit')}
        >
          Deposit
        </button>
        <button 
          className={`tab ${activeTab === 'withdraw' ? 'active' : ''}`}
          onClick={() => setActiveTab('withdraw')}
        >
          Withdraw
        </button>
        <button 
          className={`tab ${activeTab === 'pay' ? 'active' : ''}`}
          onClick={() => setActiveTab('pay')}
        >
          Pay
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'deposit' && (
          <div className="action-form">
            <div className="form-group">
              <label>Amount (ETH)</label>
              <input
                type="number"
                step="0.001"
                placeholder="0.0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                disabled={loading}
              />
            </div>
            <button 
              className="action-button primary"
              onClick={handleDeposit}
              disabled={loading}
            >
              {loading ? (txStatus === 'confirming' ? 'Confirming on blockchain...' : 'Waiting for wallet...') : 'Deposit ETH'}
            </button>
          </div>
        )}

        {activeTab === 'withdraw' && (
          <div className="action-form">
            <div className="form-group">
              <label>Amount (ETH)</label>
              <input
                type="number"
                step="0.001"
                placeholder="0.0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Recipient Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="button-group">
              <button 
                className="action-button primary"
                onClick={handleWithdraw}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Withdraw'}
              </button>
              <button 
                className="action-button secondary"
                onClick={handleWithdrawAll}
                disabled={loading}
              >
                Withdraw All
              </button>
            </div>
          </div>
        )}

        {activeTab === 'pay' && (
          <div className="action-form">
            <div className="form-group">
              <label>Recipient Address or ENS</label>
              <input
                type="text"
                placeholder="0x... or vitalik.eth"
                value={payAddress}
                onChange={(e) => {
                  setPayAddress(e.target.value);
                  setResolvedAddress('');
                }}
                disabled={loading}
              />
              {resolvedAddress && (
                <small className="resolved-ens">
                  ✓ Resolved to: {resolvedAddress.slice(0, 6)}...{resolvedAddress.slice(-4)}
                </small>
              )}
              {resolvingENS && (
                <small className="resolving-ens">
                  🔍 Resolving ENS name...
                </small>
              )}
            </div>
            <div className="form-group">
              <label>Amount (ETH)</label>
              <input
                type="number"
                step="0.001"
                placeholder="0.0"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                disabled={loading}
              />
            </div>
            <button 
              className="action-button primary"
              onClick={handlePay}
              disabled={loading || resolvingENS}
            >
              {resolvingENS ? 'Resolving ENS...' : loading ? 'Processing...' : 'Send Payment'}
            </button>
          </div>
        )}

        {error && (
          <div className="message error">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 12H7V7h2v5zm0-6H7V4h2v2z" fill="currentColor"/>
            </svg>
            {error}
          </div>
        )}

        {txStatus === 'pending' && (
          <div className="message info">
            <div className="spinner"></div>
            Waiting for wallet confirmation...
          </div>
        )}

        {txStatus === 'confirming' && txHash && (
          <div className="message info">
            <div className="spinner"></div>
            Transaction sent! Confirming on blockchain...
            <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="tx-link">
              View on Etherscan →
            </a>
          </div>
        )}

        {txStatus === 'success' && txHash && (
          <div className="message success">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm-1 12L3 8l1.4-1.4L7 9.2l4.6-4.6L13 6l-6 6z" fill="currentColor"/>
            </svg>
            Transaction confirmed! 
            <button 
              onClick={() => setShowTxDetails(true)}
              className="tx-details-btn"
            >
              📊 View Details
            </button>
            <a 
              href={buildExplorerLink('tx', txHash, chainId)} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="tx-link"
            >
              View on Blockscout →
            </a>
          </div>
        )}

        {!txStatus && txHash && (
          <div className="message success">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm-1 12L3 8l1.4-1.4L7 9.2l4.6-4.6L13 6l-6 6z" fill="currentColor"/>
            </svg>
            Transaction successful! 
            <button 
              onClick={() => setShowTxDetails(true)}
              className="tx-details-btn"
            >
              📊 View Details
            </button>
            <a 
              href={buildExplorerLink('tx', txHash, chainId)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="tx-link"
            >
              View on Blockscout
            </a>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {showTxDetails && txHash && (
        <TransactionDetailsModal
          txHash={txHash}
          chainId={chainId}
          onClose={() => setShowTxDetails(false)}
        />
      )}
    </div>
  );
};

export default ActionPanel;
