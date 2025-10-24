import { ref as dbRef, push, get, set } from 'firebase/database';
import { database } from '../config/firebase';

/**
 * Sends an automatic system message to a chat conversation
 * @param {string} userAddress1 - First user's address
 * @param {string} userAddress2 - Second user's address  
 * @param {string} messageType - Type of message: 'loan-funded', 'loan-repaid', 'borrow-request'
 * @param {object} data - Additional data like amount, interestRate, etc.
 */
export const sendAutoChatMessage = async (userAddress1, userAddress2, messageType, data = {}) => {
  try {
    const addr1 = userAddress1.toLowerCase();
    const addr2 = userAddress2.toLowerCase();

    // Find existing conversation between these two users
    const conversationsRef = dbRef(database, 'conversations');
    const snapshot = await get(conversationsRef);
    
    let conversationId = null;
    
    if (snapshot.exists()) {
      const conversations = snapshot.val();
      // Find conversation where both users are participants
      const foundConvo = Object.entries(conversations).find(([, convo]) => {
        const participants = [convo.user1.toLowerCase(), convo.user2.toLowerCase()];
        return participants.includes(addr1) && participants.includes(addr2);
      });
      
      if (foundConvo) {
        conversationId = foundConvo[0];
      }
    }

    // If no conversation exists, create one
    if (!conversationId) {
      const newConvo = {
        user1: addr1,
        user2: addr2,
        createdAt: Date.now(),
        lastMessageTime: Date.now(),
      };
      const newConvoRef = await push(conversationsRef, newConvo);
      conversationId = newConvoRef.key;
    }

    // Prepare message content based on type
    let messageContent = '';
    let messageClass = '';
    
    switch (messageType) {
      case 'loan-funded':
        messageContent = `🎉 Loan funded! ${data.amount} ETH has been sent to you with ${data.interestRate}% interest. Due in ${data.duration} days.`;
        messageClass = 'loan-funded';
        break;
      case 'loan-repaid':
        messageContent = `✅ Payment received! ${data.amount} ETH has been repaid successfully.`;
        messageClass = 'loan-repaid';
        break;
      case 'borrow-request':
        messageContent = `📋 Borrow request: ${data.amount} ETH at ${data.interestRate}% interest for ${data.duration} days.`;
        messageClass = 'borrow-request';
        break;
      default:
        messageContent = 'Transaction completed';
        messageClass = 'system-message';
    }

    // Add transaction hash if available
    if (data.txHash) {
      messageContent += `\n\nTransaction: ${data.txHash.slice(0, 10)}...${data.txHash.slice(-8)}`;
    }

    // Send the message
    const messagesRef = dbRef(database, `messages/${conversationId}`);
    await push(messagesRef, {
      senderId: 'system', // System-generated message
      text: messageContent,
      timestamp: Date.now(),
      type: messageType,
      class: messageClass,
      data: data, // Store additional data for reference
    });

    // Update conversation's lastMessageTime
    const convoRef = dbRef(database, `conversations/${conversationId}/lastMessageTime`);
    await set(convoRef, Date.now());

    console.log(`✅ Auto chat message sent: ${messageType} to conversation ${conversationId}`);
    return conversationId;
  } catch (error) {
    console.error('Error sending auto chat message:', error);
    throw error;
  }
};

/**
 * Get or create conversation ID between two users
 */
export const getOrCreateConversation = async (userAddress1, userAddress2) => {
  try {
    const addr1 = userAddress1.toLowerCase();
    const addr2 = userAddress2.toLowerCase();

    // Find existing conversation
    const conversationsRef = dbRef(database, 'conversations');
    const snapshot = await get(conversationsRef);
    
    if (snapshot.exists()) {
      const conversations = snapshot.val();
      const foundConvo = Object.entries(conversations).find(([, convo]) => {
        const participants = [convo.user1.toLowerCase(), convo.user2.toLowerCase()];
        return participants.includes(addr1) && participants.includes(addr2);
      });
      
      if (foundConvo) {
        return foundConvo[0];
      }
    }

    // Create new conversation
    const newConvo = {
      user1: addr1,
      user2: addr2,
      createdAt: Date.now(),
      lastMessageTime: Date.now(),
    };
    const newConvoRef = await push(conversationsRef, newConvo);
    return newConvoRef.key;
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    throw error;
  }
};
