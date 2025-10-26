import React, { useState } from 'react';
import { useLit } from '../hooks/useLit';
import '../styles/LitEncryption.css';

export default function LitEncryptionDemo() {
  const { isInitialized, isInitializing, encryptForSelf, decrypt, error: litError } = useLit();
  const [message, setMessage] = useState('');
  const [encryptedData, setEncryptedData] = useState(null);
  const [decryptedMessage, setDecryptedMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEncrypt = async () => {
    if (!message.trim()) {
      setError('Please enter a message to encrypt');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const encrypted = await encryptForSelf(message);
      setEncryptedData(encrypted);
      setDecryptedMessage('');
      
      console.log('✅ Message encrypted with Lit Protocol');
    } catch (err) {
      console.error('Encryption error:', err);
      setError('Encryption failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecrypt = async () => {
    if (!encryptedData) {
      setError('No encrypted data to decrypt');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const decrypted = await decrypt(encryptedData);
      setDecryptedMessage(decrypted);
      
      console.log('✅ Message decrypted with Lit Protocol');
    } catch (err) {
      console.error('Decryption error:', err);
      setError('Decryption failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessage('');
    setEncryptedData(null);
    setDecryptedMessage('');
    setError('');
  };

  if (litError) {
    return (
      <div className="lit-demo-error">
        <p>⚠️ Lit Protocol initialization failed: {litError}</p>
      </div>
    );
  }

  return (
    <div className="lit-encryption-demo">
      <div className="demo-header">
        <h3>🔐 Lit Protocol Encryption</h3>
        <div className="status-indicator">
          {isInitializing && <span className="status initializing">Initializing...</span>}
          {isInitialized && <span className="status ready">✓ Ready</span>}
          {!isInitialized && !isInitializing && <span className="status not-ready">Not Initialized</span>}
        </div>
      </div>

      <div className="demo-body">
        <div className="demo-section">
          <label>Message to Encrypt:</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter a private message..."
            rows={3}
            disabled={!isInitialized || loading}
          />
          <button
            onClick={handleEncrypt}
            disabled={!isInitialized || loading || !message.trim()}
            className="encrypt-btn"
          >
            {loading ? '🔒 Encrypting...' : '🔒 Encrypt with Lit'}
          </button>
        </div>

        {encryptedData && (
          <div className="demo-section encrypted-section">
            <label>Encrypted Data:</label>
            <div className="encrypted-display">
              <div className="encrypted-item">
                <span className="label">Ciphertext:</span>
                <code>{encryptedData.ciphertext.slice(0, 100)}...</code>
              </div>
              <div className="encrypted-item">
                <span className="label">Hash:</span>
                <code>{encryptedData.dataToEncryptHash}</code>
              </div>
              <div className="encrypted-item">
                <span className="label">Access Control:</span>
                <code>Only you can decrypt</code>
              </div>
            </div>
            <button
              onClick={handleDecrypt}
              disabled={loading}
              className="decrypt-btn"
            >
              {loading ? '🔓 Decrypting...' : '🔓 Decrypt'}
            </button>
          </div>
        )}

        {decryptedMessage && (
          <div className="demo-section decrypted-section">
            <label>Decrypted Message:</label>
            <div className="decrypted-display">
              {decryptedMessage}
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {(encryptedData || decryptedMessage || error) && (
          <button onClick={handleClear} className="clear-btn">
            Clear
          </button>
        )}
      </div>

      <div className="demo-info">
        <p>
          <strong>How it works:</strong> Lit Protocol uses distributed key management 
          to encrypt your data. Only wallets that meet the access control conditions 
          can decrypt it. This is perfect for private lending terms, payroll data, 
          and confidential messages.
        </p>
      </div>
    </div>
  );
}
