import React, { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate, useLocation } from 'react-router-dom';
import { database, storage } from '../config/firebase';
import { ref as dbRef, push, onValue, query, orderByChild, set, get } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ethers } from 'ethers';
import UserAvatar from './UserAvatar';
import { useENS } from '../hooks/useENS';
import { useEFPProfile } from '../hooks/useEFPProfile';
import { useEnhancedWeb3 } from '../hooks/useEnhancedWeb3';
import { formatDistanceToNow } from 'date-fns';
import BorrowRequestModal from './BorrowRequestModal';
import InlineFundingModal from './InlineFundingModal';
import ActiveLoanModal from './ActiveLoanModal';
import '../styles/Chat.css';

const Chat = () => {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const location = useLocation();
  const { contract } = useEnhancedWeb3();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [activeBorrow, setActiveBorrow] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [borrowRequestToShow, setBorrowRequestToShow] = useState(null);
  const [fundingRequestToShow, setFundingRequestToShow] = useState(null);
  const [activeLoanToShow, setActiveLoanToShow] = useState(null);
  const [showDeleteOption, setShowDeleteOption] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [borrowForm, setBorrowForm] = useState({
    amount: '',
    reason: '',
    interestRate: '',
    duration: ''
  });
  const [lendingOfferContext, setLendingOfferContext] = useState(null);

  // Check if navigated from lending page or notification with recipient address
  useEffect(() => {
    const state = location.state;
    if (state?.recipientAddress && address && isConnected) {
      const existingConvo = conversations.find(c => 
        c.participants?.includes(state.recipientAddress.toLowerCase()) && 
        c.participants?.includes(address.toLowerCase())
      );

      // Store lending offer context if available
      if (state?.lendingOffer) {
        setLendingOfferContext(state.lendingOffer);
        // Don't auto-open modal - show offer details in chat UI instead
      }

      if (existingConvo) {
        setSelectedConversation(existingConvo);
        // Clear navigation state to prevent re-triggering
        navigate('/chat', { replace: true, state: {} });
      } else {
        // Create new conversation
        setRecipientAddress(state.recipientAddress);
        setShowNewChat(true);
        // Clear navigation state after setting up new chat
        navigate('/chat', { replace: true, state: {} });
      }
    }
  }, [location.state, address, isConnected, conversations, navigate]);

  // Fetch conversations for current user
  useEffect(() => {
    if (!isConnected || !address) return;

    const conversationsRef = dbRef(database, 'conversations');
    
    const unsubscribe = onValue(conversationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userConvos = Object.keys(data)
          .map(key => ({
            id: key,
            ...data[key]
          }))
          .filter(convo => 
            convo.participants?.includes(address.toLowerCase())
          )
          .sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
        
        setConversations(userConvos);
      } else {
        setConversations([]);
      }
    });

    return () => unsubscribe();
  }, [isConnected, address]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    const messagesRef = dbRef(database, `messages/${selectedConversation.id}`);
    const messagesQuery = query(messagesRef, orderByChild('timestamp'));
    
    const unsubscribe = onValue(messagesQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messagesArray);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [selectedConversation]);

  // Check for active borrow with conversation partner
  useEffect(() => {
    if (!selectedConversation || !address) {
      setActiveBorrow(null);
      setShowDeleteOption(false);
      return;
    }

    const otherUser = selectedConversation.participants?.find(
      p => p !== address.toLowerCase()
    );

    if (!otherUser) return;

    const checkBorrow = async () => {
      try {
        // Check if I borrowed from them
        const myBorrowsRef = dbRef(database, `borrows/${address.toLowerCase()}`);
        const myBorrowsSnapshot = await get(myBorrowsRef);
        
        if (myBorrowsSnapshot.exists()) {
          const borrows = myBorrowsSnapshot.val();
          const activeBorrowFromThem = Object.entries(borrows).find(([, borrow]) => 
            borrow.lenderAddress === otherUser && borrow.status === 'active'
          );

          if (activeBorrowFromThem) {
            setActiveBorrow({
              id: activeBorrowFromThem[0],
              ...activeBorrowFromThem[1],
              role: 'borrower'
            });
            setShowDeleteOption(false);
            return;
          }

          // Check if loan was repaid
          const repaidBorrowFromThem = Object.entries(borrows).find(([, borrow]) => 
            borrow.lenderAddress === otherUser && borrow.status === 'repaid'
          );

          if (repaidBorrowFromThem) {
            setActiveBorrow(null);
            setShowDeleteOption(true); // Show delete option to clear history
            return;
          }
        }

        // Check if they borrowed from me
        const theirBorrowsRef = dbRef(database, `borrows/${otherUser}`);
        const theirBorrowsSnapshot = await get(theirBorrowsRef);
        
        if (theirBorrowsSnapshot.exists()) {
          const borrows = theirBorrowsSnapshot.val();
          const activeBorrowFromMe = Object.entries(borrows).find(([, borrow]) => 
            borrow.lenderAddress === address.toLowerCase() && borrow.status === 'active'
          );

          if (activeBorrowFromMe) {
            setActiveBorrow({
              id: activeBorrowFromMe[0],
              ...activeBorrowFromMe[1],
              role: 'lender'
            });
            setShowDeleteOption(false);
            return;
          }

          // Check if loan was repaid
          const repaidBorrowFromMe = Object.entries(borrows).find(([, borrow]) => 
            borrow.lenderAddress === address.toLowerCase() && borrow.status === 'repaid'
          );

          if (repaidBorrowFromMe) {
            setActiveBorrow(null);
            setShowDeleteOption(true); // Show delete option to clear history
            return;
          }
        }

        setActiveBorrow(null);
        setShowDeleteOption(false);
      } catch (error) {
        console.error('Error checking borrow:', error);
        setActiveBorrow(null);
        setShowDeleteOption(false);
      }
    };

    checkBorrow();
  }, [selectedConversation, address, messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createConversation = async (e) => {
    e.preventDefault();
    
    if (!recipientAddress || !address) return;

    const recipientLower = recipientAddress.toLowerCase();
    const senderLower = address.toLowerCase();

    if (recipientLower === senderLower) {
      alert('Cannot create conversation with yourself');
      return;
    }

    // Check if conversation already exists
    const existingConvo = conversations.find(c => 
      c.participants?.includes(recipientLower) && c.participants?.includes(senderLower)
    );

    if (existingConvo) {
      setSelectedConversation(existingConvo);
      setShowNewChat(false);
      setRecipientAddress('');
      return;
    }

    try {
      const conversationsRef = dbRef(database, 'conversations');
      const newConvo = {
        participants: [senderLower, recipientLower],
        createdAt: Date.now(),
        lastMessageTime: Date.now(),
      };

      const newConvoRef = await push(conversationsRef, newConvo);
      
      setSelectedConversation({
        id: newConvoRef.key,
        ...newConvo
      });
      setShowNewChat(false);
      setRecipientAddress('');
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to create conversation');
    }
  };

  const sendMessage = async (e, fileData = null) => {
    if (e) e.preventDefault();
    
    if ((!newMessage.trim() && !fileData) || !selectedConversation || !address) return;

    try {
      const messagesRef = dbRef(database, `messages/${selectedConversation.id}`);
      const message = {
        sender: address.toLowerCase(),
        timestamp: Date.now(),
      };

      if (fileData) {
        message.type = 'file';
        message.fileName = fileData.fileName;
        message.fileUrl = fileData.fileUrl;
        message.fileType = fileData.fileType;
        message.fileSize = fileData.fileSize;
        if (newMessage.trim()) {
          message.text = newMessage.trim();
        }
      } else {
        message.type = 'text';
        message.text = newMessage.trim();
      }

      await push(messagesRef, message);

      // Update conversation's last message time
      const convoRef = dbRef(database, `conversations/${selectedConversation.id}/lastMessageTime`);
      await set(convoRef, Date.now());

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedConversation) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    try {
      setUploading(true);

      // Upload to Firebase Storage
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const fileRef = storageRef(storage, `chat-files/${selectedConversation.id}/${fileName}`);
      
      await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(fileRef);

      // Send message with file
      await sendMessage(null, {
        fileName: file.name,
        fileUrl: fileUrl,
        fileType: file.type,
        fileSize: file.size
      });

      setUploading(false);
      fileInputRef.current.value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
      setUploading(false);
    }
  };

  const handleBorrowRequest = async (e) => {
    e.preventDefault();
    
    if (!selectedConversation || !address) return;

    const otherUser = selectedConversation.participants?.find(
      p => p !== address.toLowerCase()
    );

    try {
      // Send borrow request message
      const messagesRef = dbRef(database, `messages/${selectedConversation.id}`);
      const borrowRequestMessage = {
        sender: address.toLowerCase(),
        type: 'borrow-request',
        text: `Borrow Request: ${borrowForm.amount} ETH - ${borrowForm.reason}`,
        amount: borrowForm.amount,
        reason: borrowForm.reason,
        interestRate: borrowForm.interestRate,
        duration: borrowForm.duration,
        timestamp: Date.now(),
      };

      // If this is from a lending offer, include the offer ID
      if (lendingOfferContext) {
        borrowRequestMessage.offerId = lendingOfferContext.id;
        borrowRequestMessage.text = `Borrow Request for your offer: ${borrowForm.amount} ETH at ${borrowForm.interestRate}% for ${borrowForm.duration} days - ${borrowForm.reason}`;
      }

      await push(messagesRef, borrowRequestMessage);

      // Store request in database
      const requestsRef = dbRef(database, `loanRequests/${selectedConversation.id}`);
      await push(requestsRef, {
        from: address.toLowerCase(),
        to: otherUser,
        amount: borrowForm.amount,
        reason: borrowForm.reason,
        interestRate: borrowForm.interestRate,
        duration: borrowForm.duration,
        offerId: lendingOfferContext?.id || null,
        status: 'pending',
        createdAt: Date.now(),
      });

      setShowBorrowModal(false);
      setBorrowForm({ amount: '', reason: '', interestRate: '', duration: '' });
      setLendingOfferContext(null);
      alert('Borrow request sent!');
    } catch (error) {
      console.error('Error sending borrow request:', error);
      alert('Failed to send borrow request');
    }
  };

  // Handle accept borrow request
  const handleAcceptBorrowRequest = async () => {
    // Just return true - acceptance message will be sent after successful funding
    // This prevents sending "Funding the loan now..." when transaction might fail
    return true;
  };

  // Handle reject borrow request
  const handleRejectBorrowRequest = async (request) => {
    try {
      // Just send rejection message
      const messagesRef = dbRef(database, `messages/${selectedConversation.id}`);
      await push(messagesRef, {
        sender: address.toLowerCase(),
        type: 'system',
        text: `Declined borrow request for ${request.amount} ETH`,
        timestamp: Date.now(),
      });

      return true;
    } catch (error) {
      console.error('Error rejecting borrow request:', error);
      throw error;
    }
  };

  // Handle loan repayment
  const handleLoanRepayment = async (loan) => {
    // More lenient check - only verify essentials
    if (!address) {
      alert('Please connect your wallet');
      return false;
    }

    if (!window.ethereum) {
      alert('No Ethereum provider found. Please install MetaMask.');
      return false;
    }

    try {
      // Initialize contract on-demand if not available
      let contractToUse = contract;
      
      if (!contractToUse) {
        console.log('Contract not initialized, creating on-demand...');
        const { CONTRACT_ABI, CONTRACT_ADDRESS } = await import('../config');
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        contractToUse = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      }

      const amount = ethers.parseEther(loan.remainingAmount || loan.totalRepayment);
      const ref = ethers.hexlify(ethers.randomBytes(32));

      console.log('💳 Initiating repayment:', {
        to: loan.lenderAddress,
        amount: loan.remainingAmount || loan.totalRepayment,
        ref
      });

      // Call contract pay function
      const tx = await contractToUse.pay(loan.lenderAddress, amount, ref);
      console.log('📤 Transaction sent:', tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait(1);
      console.log('✅ Transaction confirmed:', receipt);

      // Verify transaction succeeded
      if (receipt.status !== 1) {
        alert('Transaction failed. Please try again.');
        return false;
      }

      // Update loan status in Firebase
      const borrowRef = dbRef(database, `borrows/${address.toLowerCase()}/${loan.id || loan.key}`);
      await set(borrowRef, {
        ...loan,
        status: 'repaid',
        repaidAt: Date.now(),
        repaidAmount: loan.remainingAmount || loan.totalRepayment,
        transactionHash: tx.hash
      });

      // Send repayment message in chat
      if (selectedConversation) {
        const messagesRef = dbRef(database, `messages/${selectedConversation.id}`);
        await push(messagesRef, {
          sender: address.toLowerCase(),
          type: 'system',
          text: `Loan repaid! ${loan.remainingAmount || loan.totalRepayment} ETH has been sent back to the lender.`,
          timestamp: Date.now(),
        });
      }

      alert('Loan repaid successfully!');
      return true;
    } catch (error) {
      console.error('Error during repayment:', error);
      if (error.code === 'ACTION_REJECTED') {
        alert('Transaction was rejected.');
      } else if (error.message?.includes('insufficient funds')) {
        alert('Insufficient funds in your vault. Please deposit more ETH first.');
      } else {
        alert(`Repayment failed: ${error.message || 'Unknown error'}`);
      }
      return false;
    }
  };

  // Handle delete conversation
  const handleDeleteConversation = async () => {
    if (!selectedConversation || !window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete messages
      const messagesRef = dbRef(database, `messages/${selectedConversation.id}`);
      await set(messagesRef, null);

      // Delete conversation
      const convoRef = dbRef(database, `conversations/${selectedConversation.id}`);
      await set(convoRef, null);

      alert('Conversation deleted successfully');
      setSelectedConversation(null);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    }
  };

  if (!isConnected) {
    return (
      <div className="chat-container">
        <div className="chat-empty">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <path d="M56 28C56 40.1503 43.464 50 28 50C24.528 50 21.232 49.408 18.224 48.336L8 52L11.664 41.776C10.592 38.768 10 35.472 10 32C10 19.8497 22.536 10 38 10C44.064 10 49.6 11.904 54 15.168" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3>Connect Wallet to Start Chatting</h3>
          <p>Connect your wallet to communicate with lenders and borrowers</p>
        </div>
      </div>
    );
  }

  const otherParticipant = selectedConversation?.participants?.find(
    p => p !== address.toLowerCase()
  );

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h2>Messages</h2>
          <button 
            className="new-chat-btn"
            onClick={() => setShowNewChat(true)}
            title="New conversation"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {showNewChat && (
          <form className="new-chat-form" onSubmit={createConversation}>
            <input
              type="text"
              placeholder="Enter Ethereum address..."
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              required
            />
            <button type="submit">Start</button>
            <button type="button" onClick={() => setShowNewChat(false)}>Cancel</button>
          </form>
        )}

        <div className="conversations-list">
          {conversations.length === 0 ? (
            <div className="no-conversations">
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations.map(convo => {
              const otherUser = convo.participants?.find(p => p !== address.toLowerCase());
              return (
                <ConversationItem
                  key={convo.id}
                  conversation={convo}
                  otherUser={otherUser}
                  isSelected={selectedConversation?.id === convo.id}
                  onClick={() => setSelectedConversation(convo)}
                />
              );
            })
          )}
        </div>
      </div>

      <div className="chat-main">
        {selectedConversation ? (
          <>
            <div className="chat-header">
              <ConversationHeader address={otherParticipant} />
              
              <div className="header-buttons-group">
                {/* Show request loan button only if there's no active borrow with this user */}
                {!activeBorrow && (
                  <button 
                    className="request-loan-header-btn"
                    onClick={() => setShowBorrowModal(true)}
                    title="Request a loan from this user"
                  >
                    Request Loan
                  </button>
                )}
                
                {activeBorrow && activeBorrow.role === 'borrower' && (
                  <button 
                    className="repay-header-btn"
                    onClick={() => setActiveLoanToShow({
                      ...activeBorrow,
                      amount: activeBorrow.amount || activeBorrow.principalAmount,
                      totalRepayment: activeBorrow.totalRepayment,
                      remainingAmount: activeBorrow.remainingAmount || activeBorrow.totalRepayment,
                      lenderAddress: activeBorrow.lenderAddress,
                      dueDate: activeBorrow.dueDate,
                      interestRate: activeBorrow.interestRate,
                      status: activeBorrow.status
                    })}
                    title="View loan details and repayment options"
                  >
                    Repay {parseFloat(activeBorrow.totalRepayment || 0).toFixed(4)} ETH
                  </button>
                )}
              </div>
            </div>

            {/* Lending Offer Details Banner */}
            {lendingOfferContext && !activeBorrow && (
              <div className="offer-details-banner">
                <div className="offer-banner-header">
                  <h4>Lending Offer Details</h4>
                  <button 
                    className="close-offer-btn" 
                    onClick={() => setLendingOfferContext(null)}
                    title="Dismiss offer"
                  >
                    ×
                  </button>
                </div>
                <div className="offer-banner-content">
                  <div className="offer-detail-item">
                    <span className="offer-label">Amount:</span>
                    <span className="offer-value">{lendingOfferContext.amount} ETH</span>
                  </div>
                  <div className="offer-detail-item">
                    <span className="offer-label">Interest Rate:</span>
                    <span className="offer-value">{lendingOfferContext.interestRate}%</span>
                  </div>
                  <div className="offer-detail-item">
                    <span className="offer-label">Duration:</span>
                    <span className="offer-value">{lendingOfferContext.duration} days</span>
                  </div>
                  {lendingOfferContext.description && (
                    <div className="offer-description">
                      <span className="offer-label">Description:</span>
                      <p>{lendingOfferContext.description}</p>
                    </div>
                  )}
                </div>
                
                {/* Show different actions based on user role */}
                {address.toLowerCase() === lendingOfferContext.lenderAddress?.toLowerCase() ? (
                  <div className="offer-banner-actions">
                    <p className="offer-banner-note">This is your lending offer. Wait for the borrower to request the loan.</p>
                  </div>
                ) : (
                  <div className="offer-banner-actions">
                    <button 
                      className="request-from-offer-btn"
                      onClick={() => {
                        setBorrowForm({
                          amount: lendingOfferContext.amount,
                          reason: '',
                          interestRate: lendingOfferContext.interestRate,
                          duration: lendingOfferContext.duration
                        });
                        setShowBorrowModal(true);
                      }}
                    >
                      Request This Loan
                    </button>
                    <p className="offer-banner-note">Chat with the lender first, then request the loan</p>
                  </div>
                )}
              </div>
            )}

            <div className="messages-container">
              {messages.map(message => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.sender === address.toLowerCase()}
                  onViewBorrowRequest={(request) => {
                    // If current user is the receiver of the request (the lender), show funding modal
                    // If current user is the sender (borrower), show the old modal or just the message
                    if (message.sender !== address.toLowerCase()) {
                      setFundingRequestToShow(request);
                    } else {
                      setBorrowRequestToShow(request);
                    }
                  }}
                />
              ))}
              <div ref={messagesEndRef} />
              
              {showDeleteOption && !activeBorrow && (
                <div className="loan-completed-notice">
                  <div className="completed-icon">✓</div>
                  <p><strong>Previous loan completed!</strong></p>
                  <p>The previous loan has been fully repaid. You can start a new loan or delete this conversation.</p>
                  <button className="delete-chat-btn" onClick={handleDeleteConversation}>
                    Delete Conversation History
                  </button>
                </div>
              )}
            </div>

            <form className="message-input-form" onSubmit={sendMessage}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                
                <button
                  type="button"
                  className="file-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title="Upload file"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M21.44 11.05l-9.19 9.19a5.25 5.25 0 01-7.43-7.43l8.48-8.48a3.5 3.5 0 014.95 4.95l-7.78 7.78a2.25 2.25 0 11-3.18-3.18l6.36-6.36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                <input
                  type="text"
                  placeholder={uploading ? "Uploading..." : "Type a message..."}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={uploading}
                  className="message-input"
                />
                
                <button type="submit" disabled={uploading || (!newMessage.trim())} className="send-btn">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M18 2L9 11M18 2l-6 16-3-7-7-3 16-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </form>
              <div className="chat-footer-notice">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 0a6 6 0 100 12A6 6 0 006 0zm0 10.5a4.5 4.5 0 110-9 4.5 4.5 0 010 9zM6 3a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5A.75.75 0 016 3zm0 6.5a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
                </svg>
                <span>Messages are end-to-end encrypted with Lit Protocol</span>
              </div>
          </>
        ) : (
          <div className="chat-empty">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <path d="M56 28C56 40.1503 43.464 50 28 50C24.528 50 21.232 49.408 18.224 48.336L8 52L11.664 41.776C10.592 38.768 10 35.472 10 32C10 19.8497 22.536 10 38 10C44.064 10 49.6 11.904 54 15.168" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3>Select a Conversation</h3>
            <p>Choose a conversation from the sidebar to start chatting</p>
          </div>
        )}
      </div>

      {/* Lend Modal */}
      {/* Borrow Modal */}
      {showBorrowModal && (
        <div className="modal-overlay" onClick={() => setShowBorrowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Request to Borrow</h3>
              <button className="modal-close" onClick={() => setShowBorrowModal(false)}>×</button>
            </div>
            <form onSubmit={handleBorrowRequest} className="loan-form">
              <div className="form-group">
                <label>Amount Needed (ETH)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={borrowForm.amount}
                  onChange={(e) => setBorrowForm({ ...borrowForm, amount: e.target.value })}
                  placeholder="e.g., 1.0"
                  readOnly={lendingOfferContext !== null}
                />
              </div>
              <div className="form-group">
                <label>Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  value={borrowForm.interestRate}
                  onChange={(e) => setBorrowForm({ ...borrowForm, interestRate: e.target.value })}
                  placeholder="e.g., 5.5"
                  readOnly={lendingOfferContext !== null}
                />
              </div>
              <div className="form-group">
                <label>Duration (days)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={borrowForm.duration}
                  onChange={(e) => setBorrowForm({ ...borrowForm, duration: e.target.value })}
                  placeholder="e.g., 30"
                  readOnly={lendingOfferContext !== null}
                />
              </div>
              <div className="form-group">
                <label>Reason for Borrowing</label>
                <textarea
                  rows="3"
                  required
                  value={borrowForm.reason}
                  onChange={(e) => setBorrowForm({ ...borrowForm, reason: e.target.value })}
                  placeholder="Explain why you need this loan..."
                />
              </div>
              {lendingOfferContext && (
                <div className="offer-context-note">
                  Note: This request is for a specific lending offer. Terms are pre-filled and cannot be changed.
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowBorrowModal(false)}>Cancel</button>
                <button type="submit" className="submit-btn">Send Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Borrow Request Modal */}
      {borrowRequestToShow && (
        <BorrowRequestModal
          request={borrowRequestToShow}
          onClose={() => setBorrowRequestToShow(null)}
          onAccept={handleAcceptBorrowRequest}
          onReject={handleRejectBorrowRequest}
        />
      )}

      {/* Inline Funding Modal */}
      {fundingRequestToShow && (
        <InlineFundingModal
          request={fundingRequestToShow}
          conversationId={selectedConversation?.id}
          onClose={() => setFundingRequestToShow(null)}
          onFundingComplete={() => {
            setFundingRequestToShow(null);
            // Refresh or update UI
          }}
        />
      )}

      {/* Active Loan Modal */}
      {activeLoanToShow && (
        <ActiveLoanModal
          loan={activeLoanToShow}
          onClose={() => setActiveLoanToShow(null)}
          onRepay={handleLoanRepayment}
        />
      )}
    </div>
  );
};

const ConversationItem = ({ conversation, otherUser, isSelected, onClick }) => {
  const ensData = useENS(otherUser);
  const efpData = useEFPProfile(otherUser);

  const displayName = efpData.name || ensData.name || `${otherUser?.slice(0, 6)}...${otherUser?.slice(-4)}`;
  const avatar = efpData.avatar || ensData.avatar;

  return (
    <div 
      className={`conversation-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <UserAvatar
        address={otherUser}
        ensAvatar={avatar}
        ensName={displayName}
        size={48}
      />
      <div className="conversation-info">
        <div className="conversation-name">{displayName}</div>
        <div className="conversation-time">
          {conversation.lastMessageTime && 
            formatDistanceToNow(conversation.lastMessageTime, { addSuffix: true })
          }
        </div>
      </div>
    </div>
  );
};

const ConversationHeader = ({ address }) => {
  const navigate = useNavigate();
  const ensData = useENS(address);
  const efpData = useEFPProfile(address);

  const displayName = efpData.name || ensData.name || `${address?.slice(0, 6)}...${address?.slice(-4)}`;
  const avatar = efpData.avatar || ensData.avatar;
  const bio = efpData.bio || ensData.description;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address);
    alert('Address copied to clipboard!');
  };

  const handleViewProfile = () => {
    navigate(`/profile/${address}`);
  };

  return (
    <div className="conversation-header">
      <UserAvatar
        address={address}
        ensAvatar={avatar}
        ensName={displayName}
        size={40}
      />
      <div className="header-info">
        <div className="header-name">{displayName}</div>
        {bio && <div className="header-bio">{bio}</div>}
      </div>
      <div className="header-actions">
        <button
          className="header-action-btn"
          onClick={handleCopyAddress}
          title="Copy wallet address"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <path d="M5.33 2.67H2.67v10.67h8V10.67M5.33 2.67v8h8V2.67h-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          className="header-action-btn"
          onClick={handleViewProfile}
          title="View profile"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M3 13c0-2.5 2-4 5-4s5 1.5 5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

const MessageBubble = ({ message, isOwn, onViewBorrowRequest }) => {
  // System messages (loan-funded, loan-repaid)
  if (message.senderId === 'system') {
    let icon = '';
    let className = 'system-message';
    
    if (message.type === 'loan-funded') {
      icon = '✓';
      className = 'loan-funded';
    } else if (message.type === 'loan-repaid') {
      icon = '✓';
      className = 'loan-repaid';
    }
    
    return (
      <div className={`message-bubble system special-message ${className}`}>
        {icon && <div className="special-icon">{icon}</div>}
        <div className="message-text" style={{ whiteSpace: 'pre-line' }}>{message.text}</div>
        <div className="message-time">
          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
        </div>
      </div>
    );
  }

  if (message.type === 'file') {
    return (
      <div className={`message-bubble ${isOwn ? 'own' : 'other'} file-message`}>
        <div className="file-attachment">
          {message.fileType?.startsWith('image/') ? (
            <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
              <img src={message.fileUrl} alt={message.fileName} className="file-image-preview" />
            </a>
          ) : (
            <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="file-link">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                <polyline points="13 2 13 9 20 9"/>
              </svg>
              <div>
                <div className="file-name">{message.fileName}</div>
                <div className="file-size">{(message.fileSize / 1024).toFixed(1)} KB</div>
              </div>
            </a>
          )}
        </div>
        {message.text && <div className="message-text">{message.text}</div>}
        <div className="message-time">
          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
        </div>
      </div>
    );
  }

  if (message.type === 'lend-offer') {
    return (
      <div className={`message-bubble ${isOwn ? 'own' : 'other'} special-message lend-offer`}>
        <div className="message-text">{message.text}</div>
        <div className="message-time">
          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
        </div>
      </div>
    );
  }

  if (message.type === 'borrow-request') {
    // For received borrow requests (not own), show a button to view details
    if (!isOwn) {
      return (
        <div className={`message-bubble other special-message borrow-request`}>
          <div className="message-text">{message.text}</div>
          <button 
            className="view-request-btn"
            onClick={() => onViewBorrowRequest({
              id: message.id,
              borrowerAddress: message.sender,
              amount: message.amount,
              reason: message.reason,
              interestRate: message.interestRate || '5', // Default if not specified
              duration: message.duration || '30', // Default if not specified
              timestamp: message.timestamp
            })}
          >
            View Request
          </button>
          <div className="message-time">
            {formatDistanceToNow(message.timestamp, { addSuffix: true })}
          </div>
        </div>
      );
    }
    
    // For own borrow requests, just show the message
    return (
      <div className={`message-bubble own special-message borrow-request`}>
        <div className="message-text">{message.text}</div>
        <div className="message-time">
          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
        </div>
      </div>
    );
  }

  return (
    <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
      <div className="message-text">{message.text}</div>
      <div className="message-time">
        {formatDistanceToNow(message.timestamp, { addSuffix: true })}
      </div>
    </div>
  );
};

export default Chat;
