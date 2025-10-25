import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import '../styles/NomineeManagement.css';

const NomineeManagement = ({ contract, address }) => {
  const [nominees, setNominees] = useState([{ address: '', share: '' }]);
  const [nomineeConfig, setNomineeConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inactivityPeriod, setInactivityPeriod] = useState(0);
  const [lastActivity, setLastActivity] = useState(0);
  const [timeUntilInactive, setTimeUntilInactive] = useState(0);
  const [isInactive, setIsInactive] = useState(false);

  const loadNomineeData = useCallback(async () => {
    try {
      const config = await contract.getNomineeConfig(address);
      setNomineeConfig(config);
      
      // If nominees exist, load their data
      if (config.nomineeCount > 0) {
        const nomineesData = [];
        for (let i = 0; i < Number(config.nomineeCount); i++) {
          const share = await contract.getNomineeShare(address, i);
          nomineesData.push({ address: '', share: ethers.formatUnits(share, 0) });
        }
        if (nomineesData.length > 0) {
          setNominees(nomineesData);
        }
      }
    } catch (error) {
      console.error('Error loading nominee config:', error);
    }
  }, [contract, address]);

  const loadActivityData = useCallback(async () => {
    try {
      const [period, lastAct, timeLeft, inactive] = await Promise.all([
        contract.inactivityPeriod(),
        contract.lastActivity(address),
        contract.timeUntilInactive(address),
        contract.isUserInactive(address)
      ]);
      
      setInactivityPeriod(Number(period));
      setLastActivity(Number(lastAct));
      setTimeUntilInactive(Number(timeLeft));
      setIsInactive(inactive);
    } catch (error) {
      console.error('Error loading activity data:', error);
    }
  }, [contract, address]);

  useEffect(() => {
    if (contract && address) {
      loadNomineeData();
      loadActivityData();
    }
  }, [contract, address, loadNomineeData, loadActivityData]);

  const addNominee = () => {
    setNominees([...nominees, { address: '', share: '' }]);
  };

  const removeNominee = (index) => {
    setNominees(nominees.filter((_, i) => i !== index));
  };

  const handleNomineeChange = (index, field, value) => {
    const updated = [...nominees];
    updated[index][field] = value;
    setNominees(updated);
  };

  const validateNominees = () => {
    // Check all addresses are valid
    for (const nominee of nominees) {
      if (!ethers.isAddress(nominee.address)) {
        alert(`Invalid address: ${nominee.address}`);
        return false;
      }
      if (nominee.address.toLowerCase() === address.toLowerCase()) {
        alert('You cannot nominate yourself!');
        return false;
      }
      const share = parseInt(nominee.share);
      if (isNaN(share) || share <= 0 || share > 100) {
        alert('Share must be between 1 and 100');
        return false;
      }
    }

    // Check total shares = 100
    const totalShares = nominees.reduce((sum, n) => sum + parseInt(n.share), 0);
    if (totalShares !== 100) {
      alert(`Total shares must equal 100% (currently ${totalShares}%)`);
      return false;
    }

    return true;
  };

  const handleSetNominees = async () => {
    if (!validateNominees()) return;

    setLoading(true);
    try {
      const addresses = nominees.map(n => n.address);
      const shares = nominees.map(n => ethers.parseUnits(n.share, 0));
      
      // Empty encrypted data for now (you can add encryption later)
      const encryptedData = ethers.toUtf8Bytes('');

      const tx = nomineeConfig && nomineeConfig.nomineeCount > 0
        ? await contract.updateNominees(encryptedData, addresses, shares)
        : await contract.setNominees(encryptedData, addresses, shares);

      await tx.wait();
      alert('Nominees saved successfully!');
      await loadNomineeData();
    } catch (error) {
      console.error('Error setting nominees:', error);
      alert('Failed to set nominees: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveNominees = async () => {
    if (!confirm('Are you sure you want to remove all nominees?')) return;

    setLoading(true);
    try {
      const tx = await contract.removeNominees();
      await tx.wait();
      alert('Nominees removed successfully!');
      setNominees([{ address: '', share: '' }]);
      await loadNomineeData();
    } catch (error) {
      console.error('Error removing nominees:', error);
      alert('Failed to remove nominees: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePingActivity = async () => {
    setLoading(true);
    try {
      const ref = ethers.id('ping-' + Date.now());
      const tx = await contract.pingActivity(ref);
      await tx.wait();
      alert('Activity pinged successfully!');
      await loadActivityData();
    } catch (error) {
      console.error('Error pinging activity:', error);
      alert('Failed to ping activity: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp || timestamp === 0) return 'Never';
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="nominee-management">
      <div className="nominee-header">
        <h2>🛡️ Nominee Management</h2>
        <p className="nominee-description">
          Set up nominees who can claim your funds if you become inactive
        </p>
      </div>

      {/* Activity Status */}
      <div className="activity-status">
        <h3>Activity Status</h3>
        <div className="activity-grid">
          <div className="activity-card">
            <span className="activity-label">Status</span>
            <span className={`activity-value ${isInactive ? 'inactive' : 'active'}`}>
              {isInactive ? '❌ Inactive' : '✅ Active'}
            </span>
          </div>
          <div className="activity-card">
            <span className="activity-label">Last Activity</span>
            <span className="activity-value">{formatDate(lastActivity)}</span>
          </div>
          <div className="activity-card">
            <span className="activity-label">Inactivity Period</span>
            <span className="activity-value">{formatTime(inactivityPeriod)}</span>
          </div>
          <div className="activity-card">
            <span className="activity-label">Time Until Inactive</span>
            <span className="activity-value">
              {isInactive ? 'Already Inactive' : formatTime(timeUntilInactive)}
            </span>
          </div>
        </div>
        <button 
          className="ping-button" 
          onClick={handlePingActivity}
          disabled={loading}
        >
          📡 Ping Activity
        </button>
      </div>

      {/* Nominee Configuration */}
      <div className="nominee-config">
        <h3>Configure Nominees</h3>
        {nomineeConfig && nomineeConfig.nomineeCount > 0 && (
          <div className="config-info">
            <p>✓ {Number(nomineeConfig.nomineeCount)} nominee(s) configured</p>
            <p>Last Updated: {formatDate(Number(nomineeConfig.lastUpdated))}</p>
          </div>
        )}

        <div className="nominees-list">
          {nominees.map((nominee, index) => (
            <div key={index} className="nominee-item">
              <div className="nominee-number">{index + 1}</div>
              <input
                type="text"
                placeholder="Nominee address (0x...)"
                value={nominee.address}
                onChange={(e) => handleNomineeChange(index, 'address', e.target.value)}
                className="nominee-address-input"
              />
              <input
                type="number"
                placeholder="Share %"
                value={nominee.share}
                onChange={(e) => handleNomineeChange(index, 'share', e.target.value)}
                className="nominee-share-input"
                min="1"
                max="100"
              />
              <button
                className="remove-nominee-btn"
                onClick={() => removeNominee(index)}
                disabled={nominees.length === 1}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="nominee-actions">
          <button className="add-nominee-btn" onClick={addNominee}>
            + Add Nominee
          </button>
          <div className="nominee-actions-right">
            {nomineeConfig && nomineeConfig.nomineeCount > 0 && (
              <button
                className="remove-all-btn"
                onClick={handleRemoveNominees}
                disabled={loading}
              >
                Remove All
              </button>
            )}
            <button
              className="save-nominees-btn"
              onClick={handleSetNominees}
              disabled={loading}
            >
              {loading ? 'Saving...' : nomineeConfig && nomineeConfig.nomineeCount > 0 ? 'Update Nominees' : 'Set Nominees'}
            </button>
          </div>
        </div>

        <div className="nominee-help">
          <h4>ℹ️ How it works:</h4>
          <ul>
            <li>Nominees can claim their share if you're inactive for {formatTime(inactivityPeriod)}</li>
            <li>Total shares must equal 100%</li>
            <li>You cannot nominate yourself</li>
            <li>Ping activity regularly to stay active</li>
            <li>Every deposit/withdrawal/payment automatically pings your activity</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NomineeManagement;
