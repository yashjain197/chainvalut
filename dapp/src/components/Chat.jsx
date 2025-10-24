import React, { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { database, storage } from '../config/firebase';
import { ref as dbRef, push, onValue, query, orderByChild, set, get } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import UserAvatar from './UserAvatar';
import { useENS } from '../hooks/useENS';
import { useEFPProfile } from '../hooks/useEFPProfile';
import { formatDistanceToNow } from 'date-fns';
import '../styles/Chat.css';

const Chat = () => {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const location = window.location;
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showLendModal, setShowLendModal] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [activeBorrow, setActiveBorrow] = useState(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [lendForm, setLendForm] = useState({
    amount: '',
    interestRate: '',
    duration: '30'
  });

  const [borrowForm, setBorrowForm] = useState({
    amount: '',
    reason: ''
  });

  // Check if navigated from lending page with recipient address
  useEffect(() => {
    const state = history.state?.usr;
    if (state?.recipientAddress && address && isConnected) {
      const existingConvo = conversations.find(c => 
        c.participants?.includes(state.recipientAddress.toLowerCase()) && 
        c.participants?.includes(address.toLowerCase())
      );

      if (existingConvo) {
        setSelectedConversation(existingConvo);
      } else {
        // Create new conversation
        setRecipientAddress(state.recipientAddress);
        setShowNewChat(true);
      }
    }
  }, [location, address, isConnected, conversations]);

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
            return;
          }
        }

        setActiveBorrow(null);
      } catch (error) {
        console.error('Error checking borrow:', error);
        setActiveBorrow(null);
      }
    };

    checkBorrow();
  }, [selectedConversation, address]);

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

  const handleLendOffer = async (e) => {
    e.preventDefault();
    
    if (!selectedConversation || !address) return;

    const otherUser = selectedConversation.participants?.find(
      p => p !== address.toLowerCase()
    );

    try {
      // Create lending offer
      const offersRef = dbRef(database, 'lendingOffers');
      const newOffer = {
        lenderAddress: address.toLowerCase(),
        amount: lendForm.amount,
        interestRate: parseFloat(lendForm.interestRate),
        duration: parseInt(lendForm.duration),
        description: `Direct offer via chat`,
        status: 'pending-payment',
        createdAt: Date.now(),
        borrower: otherUser,
        conversationId: selectedConversation.id,
        targetBorrower: otherUser,
      };

      const newOfferRef = await push(offersRef, newOffer);

      // Send message about the offer
      const messagesRef = dbRef(database, `messages/${selectedConversation.id}`);
      await push(messagesRef, {
        sender: address.toLowerCase(),
        type: 'lend-offer',
        text: `💰 Lending Offer: ${lendForm.amount} ETH at ${lendForm.interestRate}% for ${lendForm.duration} days`,
        amount: lendForm.amount,
        interestRate: lendForm.interestRate,
        duration: lendForm.duration,
        timestamp: Date.now(),
      });

      setShowLendModal(false);
      
      // Redirect to payment page to actually send ETH
      navigate('/payment', {
        state: {
          mode: 'lend',
          lendData: {
            borrowerAddress: otherUser,
            amount: lendForm.amount,
            interestRate: parseFloat(lendForm.interestRate),
            duration: parseInt(lendForm.duration),
            offerId: newOfferRef.key,
          }
        }
      });

      setLendForm({ amount: '', interestRate: '', duration: '30' });
    } catch (error) {
      console.error('Error creating lend offer:', error);
      alert('Failed to send lending offer');
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
      await push(messagesRef, {
        sender: address.toLowerCase(),
        type: 'borrow-request',
        text: `🙏 Borrow Request: ${borrowForm.amount} ETH - ${borrowForm.reason}`,
        amount: borrowForm.amount,
        reason: borrowForm.reason,
        timestamp: Date.now(),
      });

      // Store request in database
      const requestsRef = dbRef(database, `loanRequests/${selectedConversation.id}`);
      await push(requestsRef, {
        from: address.toLowerCase(),
        to: otherUser,
        amount: borrowForm.amount,
        reason: borrowForm.reason,
        status: 'pending',
        createdAt: Date.now(),
      });

      setShowBorrowModal(false);
      setBorrowForm({ amount: '', reason: '' });
      alert('Borrow request sent!');
    } catch (error) {
      console.error('Error sending borrow request:', error);
      alert('Failed to send borrow request');
    }
  };

  const handleRepay = () => {
    if (!activeBorrow || activeBorrow.role !== 'borrower') return;
    navigate(`/payment/${activeBorrow.id}`);
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
              
              {activeBorrow && activeBorrow.role === 'borrower' && (
                <button 
                  className="repay-header-btn"
                  onClick={handleRepay}
                  title="Repay loan"
                >
                  💳 Repay {activeBorrow.totalRepayment?.toFixed(4)} ETH
                </button>
              )}
            </div>

            <div className="messages-container">
              {messages.map(message => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.sender === address.toLowerCase()}
                />
              ))}
              <div ref={messagesEndRef} />
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
                📎
              </button>

              <div className="actions-menu-container">
                <button
                  type="button"
                  className="actions-btn"
                  onClick={() => setShowActions(!showActions)}
                  title="Borrow or Lend"
                >
                  ➕
                </button>

                {showActions && (
                  <div className="actions-menu">
                    <button type="button" onClick={() => { setShowBorrowModal(true); setShowActions(false); }}>
                      🙏 Request Borrow
                    </button>
                    <button type="button" onClick={() => { setShowLendModal(true); setShowActions(false); }}>
                      💰 Offer to Lend
                    </button>
                  </div>
                )}
              </div>

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
      {showLendModal && (
        <div className="modal-overlay" onClick={() => setShowLendModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💰 Offer to Lend</h3>
              <button className="modal-close" onClick={() => setShowLendModal(false)}>×</button>
            </div>
            <form onSubmit={handleLendOffer} className="loan-form">
              <div className="form-group">
                <label>Amount (ETH)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={lendForm.amount}
                  onChange={(e) => setLendForm({ ...lendForm, amount: e.target.value })}
                  placeholder="e.g., 1.5"
                />
              </div>
              <div className="form-group">
                <label>Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  value={lendForm.interestRate}
                  onChange={(e) => setLendForm({ ...lendForm, interestRate: e.target.value })}
                  placeholder="e.g., 5.5"
                />
              </div>
              <div className="form-group">
                <label>Duration (days)</label>
                <select
                  value={lendForm.duration}
                  onChange={(e) => setLendForm({ ...lendForm, duration: e.target.value })}
                  required
                >
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowLendModal(false)}>Cancel</button>
                <button type="submit" className="submit-btn">Send Offer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Borrow Modal */}
      {showBorrowModal && (
        <div className="modal-overlay" onClick={() => setShowBorrowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🙏 Request to Borrow</h3>
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
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowBorrowModal(false)}>Cancel</button>
                <button type="submit" className="submit-btn">Send Request</button>
              </div>
            </form>
          </div>
        </div>
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

const MessageBubble = ({ message, isOwn }) => {
  // System messages (loan-funded, loan-repaid)
  if (message.senderId === 'system') {
    let icon = '🔔';
    let className = 'system-message';
    
    if (message.type === 'loan-funded') {
      icon = '🎉';
      className = 'loan-funded';
    } else if (message.type === 'loan-repaid') {
      icon = '✅';
      className = 'loan-repaid';
    }
    
    return (
      <div className={`message-bubble system special-message ${className}`}>
        <div className="special-icon">{icon}</div>
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
        <div className="special-icon">💰</div>
        <div className="message-text">{message.text}</div>
        <div className="message-time">
          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
        </div>
      </div>
    );
  }

  if (message.type === 'borrow-request') {
    return (
      <div className={`message-bubble ${isOwn ? 'own' : 'other'} special-message borrow-request`}>
        <div className="special-icon">🙏</div>
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
