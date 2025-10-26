import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { ref, set, get, remove, update } from 'firebase/database';
import { database } from '../config/firebase';
import '../styles/ScheduledPayroll.css';

const ScheduledPayroll = ({ contract, address }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  // New schedule form state
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    frequency: 'monthly', // daily, weekly, biweekly, monthly, custom, specific-date
    customInterval: '', // days for custom interval
    specificDate: '', // for specific date option
    startDate: '',
    endDate: '', // optional
    duration: '', // number of payments (alternative to endDate)
    recipients: [{ wallet: '', amount: '', name: '' }],
    autoExecute: true, // Sign once, auto-execute payments
    isPaused: false,
    nextPayment: null,
    paymentsCompleted: 0,
    isApproved: false, // Whether user has signed approval
    approvalSignature: null,
  });

  // Load schedules from Firebase
  const loadSchedules = useCallback(async () => {
    if (!address) return;

    try {
      const schedulesRef = ref(database, `payrollSchedules/${address}`);
      const snapshot = await get(schedulesRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const schedulesList = Object.entries(data).map(([id, schedule]) => ({
          id,
          ...schedule
        }));
        setSchedules(schedulesList);
      } else {
        setSchedules([]);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  }, [address]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // Calculate next payment date based on frequency
  const calculateNextPayment = (startDate, frequency, customInterval, specificDate) => {
    const start = new Date(startDate);
    const now = new Date();
    
    // For specific date option, just use that date
    if (frequency === 'specific-date' && specificDate) {
      const targetDate = new Date(specificDate);
      return targetDate > now ? targetDate.toISOString() : null;
    }
    
    if (start > now) return start.toISOString();

    let nextDate = new Date(start);
    
    switch (frequency) {
      case 'daily':
        while (nextDate <= now) {
          nextDate.setDate(nextDate.getDate() + 1);
        }
        break;
      case 'weekly':
        while (nextDate <= now) {
          nextDate.setDate(nextDate.getDate() + 7);
        }
        break;
      case 'biweekly':
        while (nextDate <= now) {
          nextDate.setDate(nextDate.getDate() + 14);
        }
        break;
      case 'monthly':
        while (nextDate <= now) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        break;
      case 'custom': {
        const days = parseInt(customInterval) || 30;
        while (nextDate <= now) {
          nextDate.setDate(nextDate.getDate() + days);
        }
        break;
      }
      default:
        break;
    }
    
    return nextDate.toISOString();
  };

  // Execute payroll silently (for automated execution)
  const executePayrollSilently = useCallback(async (schedule) => {
    if (!contract || !address) return;

    // Check if schedule has ended
    if (schedule.endDate) {
      const endDate = new Date(schedule.endDate);
      const now = new Date();
      if (now > endDate) {
        console.log(`Schedule ${schedule.name} has ended`);
        return;
      }
    }

    // Check if payment limit reached
    if (schedule.duration && schedule.paymentsCompleted >= parseInt(schedule.duration)) {
      console.log(`Schedule ${schedule.name} has completed all payments`);
      return;
    }

    const totalAmount = schedule.recipients.reduce(
      (sum, r) => sum + parseFloat(r.amount),
      0
    );

    // Check vault balance
    try {
      const vaultBalance = await contract.balanceOf(address);
      const vaultBalanceEth = parseFloat(ethers.formatEther(vaultBalance));
      
      if (vaultBalanceEth < totalAmount) {
        console.warn(`Insufficient vault balance for ${schedule.name}`);
        return;
      }
    } catch (error) {
      console.error('Error checking balance:', error);
      return;
    }

    try {
      // Execute each payment
      for (const recipient of schedule.recipients) {
        const amount = ethers.parseEther(recipient.amount);
        const ref = ethers.hexlify(ethers.randomBytes(32));
        
        const tx = await contract.pay(recipient.wallet, amount, ref);
        await tx.wait();
        console.log(`Paid ${recipient.amount} ETH to ${recipient.wallet}`);
      }

      // Update schedule in Firebase
      const nextPayment = calculateNextPayment(
        new Date().toISOString(),
        schedule.frequency,
        schedule.customInterval
      );

      const scheduleRef = ref(database, `payrollSchedules/${address}/${schedule.id}`);
      await update(scheduleRef, {
        paymentsCompleted: (schedule.paymentsCompleted || 0) + 1,
        lastPayment: new Date().toISOString(),
        nextPayment,
        updatedAt: Date.now(),
      });

      console.log(`✅ Auto-executed payroll: ${schedule.name}`);
      loadSchedules();
    } catch (error) {
      console.error('Error in auto-execution:', error);
      throw error;
    }
  }, [contract, address, loadSchedules]);

  // Check for due payments and execute automatically
  useEffect(() => {
    if (!contract || !address || schedules.length === 0) return;

    const checkAndExecuteDuePayments = async () => {
      const now = new Date();
      
      for (const schedule of schedules) {
        // Skip if paused or not approved for auto-execution
        if (schedule.isPaused || !schedule.autoExecute || !schedule.isApproved) {
          continue;
        }

        // Check if payment is due
        if (schedule.nextPayment) {
          const nextPaymentDate = new Date(schedule.nextPayment);
          
          // If next payment time has passed, execute it
          if (now >= nextPaymentDate) {
            console.log(`Auto-executing payroll: ${schedule.name}`);
            try {
              await executePayrollSilently(schedule);
            } catch (error) {
              console.error(`Failed to auto-execute payroll ${schedule.name}:`, error);
            }
          }
        }
      }
    };

    // Check every minute for due payments
    const interval = setInterval(checkAndExecuteDuePayments, 60000);
    
    // Also check immediately on mount/update
    checkAndExecuteDuePayments();

    return () => clearInterval(interval);
  }, [contract, address, schedules, executePayrollSilently]);

  // Add recipient to new schedule
  const addRecipient = () => {
    setNewSchedule({
      ...newSchedule,
      recipients: [...newSchedule.recipients, { wallet: '', amount: '', name: '' }]
    });
  };

  // Remove recipient from new schedule
  const removeRecipient = (index) => {
    const recipients = newSchedule.recipients.filter((_, i) => i !== index);
    setNewSchedule({ ...newSchedule, recipients });
  };

  // Update recipient data
  const updateRecipient = (index, field, value) => {
    const recipients = [...newSchedule.recipients];
    recipients[index][field] = value;
    setNewSchedule({ ...newSchedule, recipients });
  };

  // Calculate total payments needed
  const calculateTotalPayments = (startDate, endDate, frequency, customInterval, duration) => {
    if (duration) return parseInt(duration);
    if (!endDate) return Infinity;

    const start = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;
    let current = new Date(start);

    while (current <= end) {
      count++;
      switch (frequency) {
        case 'daily':
          current.setDate(current.getDate() + 1);
          break;
        case 'weekly':
          current.setDate(current.getDate() + 7);
          break;
        case 'biweekly':
          current.setDate(current.getDate() + 14);
          break;
        case 'monthly':
          current.setMonth(current.getMonth() + 1);
          break;
        case 'custom': {
          current.setDate(current.getDate() + (parseInt(customInterval) || 30));
          break;
        }
        default:
          return Infinity;
      }
    }
    
    return count;
  };

  // Create new schedule
  const handleCreateSchedule = async () => {
    // Check if wallet is connected and contract is available
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    if (!contract) {
      alert('Waiting for contract to initialize. Please try again in a moment.');
      return;
    }

    // Validation
    if (!newSchedule.name.trim()) {
      alert('Please enter a schedule name');
      return;
    }

    if (!newSchedule.startDate) {
      alert('Please select a start date');
      return;
    }

    // Validate end date is after start date
    if (newSchedule.endDate) {
      const startDate = new Date(newSchedule.startDate);
      const endDate = new Date(newSchedule.endDate);
      
      if (endDate <= startDate) {
        alert('End date must be after start date');
        return;
      }
    }

    if (newSchedule.recipients.length === 0) {
      alert('Please add at least one recipient');
      return;
    }

    // Validate all recipients
    for (const recipient of newSchedule.recipients) {
      if (!recipient.wallet || !recipient.amount || !recipient.name) {
        alert('Please fill all recipient fields');
        return;
      }
      if (!ethers.isAddress(recipient.wallet)) {
        alert(`Invalid wallet address: ${recipient.wallet}`);
        return;
      }
    }

    if (newSchedule.frequency === 'custom' && (!newSchedule.customInterval || parseInt(newSchedule.customInterval) < 1)) {
      alert('Please enter a valid custom interval (minimum 1 day)');
      return;
    }

    if (newSchedule.frequency === 'specific-date' && !newSchedule.specificDate) {
      alert('Please select a specific date for payment');
      return;
    }

    setLoading(true);
    try {
      // Get wallet signature for automation approval
      let approvalSignature = editingSchedule?.approvalSignature || null;
      
      if (newSchedule.autoExecute && !editingSchedule) {
        const message = `I approve automated recurring payments for schedule: ${newSchedule.name}\n` +
          `Recipients: ${newSchedule.recipients.length}\n` +
          `Total per payment: ${calculateTotalPerPayment(newSchedule.recipients)} ETH\n` +
          `Frequency: ${getFrequencyLabel(newSchedule.frequency, newSchedule.customInterval)}\n` +
          `This signature authorizes ChainVault to execute these payments automatically.`;
        
        try {
          // Request signature from user's wallet
          const signer = await contract.runner;
          approvalSignature = await signer.signMessage(message);
          console.log('User approved automation with signature:', approvalSignature);
        } catch (sigError) {
          console.error('User rejected signature:', sigError);
          alert('You must sign to enable automated payments. Schedule will be created but paused.');
          newSchedule.isPaused = true;
          newSchedule.autoExecute = false;
        }
      }

      const scheduleId = editingSchedule?.id || `schedule_${Date.now()}`;
      const nextPayment = calculateNextPayment(
        newSchedule.startDate,
        newSchedule.frequency,
        newSchedule.customInterval,
        newSchedule.specificDate
      );

      const totalPayments = calculateTotalPayments(
        newSchedule.startDate,
        newSchedule.endDate,
        newSchedule.frequency,
        newSchedule.customInterval,
        newSchedule.duration
      );

      const scheduleData = {
        ...newSchedule,
        nextPayment,
        totalPayments,
        approvalSignature,
        isApproved: !!approvalSignature,
        createdAt: editingSchedule?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      const scheduleRef = ref(database, `payrollSchedules/${address}/${scheduleId}`);
      await set(scheduleRef, scheduleData);

      const message = editingSchedule 
        ? '✅ Schedule updated successfully!' 
        : (approvalSignature 
          ? '✅ Schedule created and approved! Payments will execute automatically.' 
          : '✅ Schedule created. Enable automation to auto-execute payments.');
      
      alert(message);
      setShowCreateModal(false);
      setEditingSchedule(null);
      setNewSchedule({
        name: '',
        frequency: 'monthly',
        customInterval: '',
        specificDate: '',
        startDate: '',
        endDate: '',
        duration: '',
        recipients: [{ wallet: '', amount: '', name: '' }],
        autoExecute: true,
        isPaused: false,
        nextPayment: null,
        paymentsCompleted: 0,
        isApproved: false,
        approvalSignature: null,
      });
      loadSchedules();
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  // Execute payroll manually
  const handleExecutePayroll = async (schedule) => {
    if (!contract) {
      alert('Contract not initialized');
      return;
    }

    if (schedule.isPaused) {
      alert('This schedule is paused. Please unpause it first.');
      return;
    }

    // Check if schedule has ended
    if (schedule.endDate) {
      const endDate = new Date(schedule.endDate);
      const now = new Date();
      
      if (now > endDate) {
        alert('This schedule has ended. The end date has passed.');
        return;
      }
    }

    // Check if payment limit reached
    if (schedule.duration && schedule.paymentsCompleted >= parseInt(schedule.duration)) {
      alert(`This schedule has completed all ${schedule.duration} payments.`);
      return;
    }

    const totalAmount = schedule.recipients.reduce(
      (sum, r) => sum + parseFloat(r.amount),
      0
    );

    // Check vault balance before executing
    try {
      const vaultBalance = await contract.balanceOf(address);
      const vaultBalanceEth = parseFloat(ethers.formatEther(vaultBalance));
      
      if (vaultBalanceEth < totalAmount) {
        alert(
          `Insufficient vault balance!\n\n` +
          `Required: ${totalAmount} ETH\n` +
          `Available: ${vaultBalanceEth.toFixed(4)} ETH\n\n` +
          `Please deposit more funds to your vault first.`
        );
        return;
      }
    } catch (error) {
      console.error('Error checking balance:', error);
      alert('Failed to check vault balance. Please try again.');
      return;
    }

    if (!window.confirm(
      `Execute payroll "${schedule.name}"?\n\n` +
      `Total: ${totalAmount} ETH to ${schedule.recipients.length} recipient(s)\n\n` +
      `This will deduct from your vault balance.`
    )) {
      return;
    }

    setLoading(true);
    try {
      // Execute each payment
      for (const recipient of schedule.recipients) {
        const amount = ethers.parseEther(recipient.amount);
        const ref = ethers.hexlify(ethers.randomBytes(32));
        
        const tx = await contract.pay(recipient.wallet, amount, ref);
        await tx.wait();
      }

      // Update schedule in Firebase
      const nextPayment = calculateNextPayment(
        new Date().toISOString(),
        schedule.frequency,
        schedule.customInterval
      );

      const scheduleRef = ref(database, `payrollSchedules/${address}/${schedule.id}`);
      await update(scheduleRef, {
        paymentsCompleted: (schedule.paymentsCompleted || 0) + 1,
        lastPayment: new Date().toISOString(),
        nextPayment,
        updatedAt: Date.now(),
      });

      alert('✅ Payroll executed successfully!');
      loadSchedules();
    } catch (error) {
      console.error('Error executing payroll:', error);
      
      let errorMessage = 'Failed to execute payroll: ';
      
      if (error.message?.includes('insufficient funds') || error.code === 'INSUFFICIENT_FUNDS') {
        errorMessage += 'Insufficient funds in wallet for gas fees.';
      } else if (error.message?.includes('execution reverted')) {
        errorMessage += 'Transaction reverted. This may be due to insufficient vault balance or invalid recipient address.';
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction cancelled by user.';
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Pause/Resume schedule
  const handleTogglePause = async (schedule) => {
    try {
      const scheduleRef = ref(database, `payrollSchedules/${address}/${schedule.id}`);
      await update(scheduleRef, {
        isPaused: !schedule.isPaused,
        updatedAt: Date.now(),
      });
      loadSchedules();
    } catch (error) {
      console.error('Error toggling pause:', error);
      alert('Failed to update schedule');
    }
  };

  // Delete schedule
  const handleDeleteSchedule = async (schedule) => {
    if (!window.confirm(`Delete schedule "${schedule.name}"?\n\nThis cannot be undone.`)) {
      return;
    }

    try {
      const scheduleRef = ref(database, `payrollSchedules/${address}/${schedule.id}`);
      await remove(scheduleRef);
      alert('✅ Schedule deleted');
      loadSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Failed to delete schedule');
    }
  };

  // Edit schedule
  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setNewSchedule({
      name: schedule.name,
      frequency: schedule.frequency,
      customInterval: schedule.customInterval || '',
      startDate: schedule.startDate,
      endDate: schedule.endDate || '',
      duration: schedule.duration || '',
      recipients: schedule.recipients,
      autoExecute: schedule.autoExecute || false,
      isPaused: schedule.isPaused || false,
      nextPayment: schedule.nextPayment,
      paymentsCompleted: schedule.paymentsCompleted || 0,
    });
    setShowCreateModal(true);
  };

  // Calculate total per payment
  const calculateTotalPerPayment = (recipients) => {
    return recipients.reduce((sum, r) => {
      const amount = parseFloat(r.amount) || 0;
      return sum + amount;
    }, 0);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get frequency label
  const getFrequencyLabel = (frequency, customInterval) => {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'biweekly': return 'Bi-weekly';
      case 'monthly': return 'Monthly';
      case 'custom': return `Every ${customInterval} day(s)`;
      case 'specific-date': return 'One-time Payment';
      default: return frequency;
    }
  };

  // Check if payment is due
  const isPaymentDue = (schedule) => {
    if (!schedule.nextPayment) return false;
    return new Date(schedule.nextPayment) <= new Date();
  };

  return (
    <div className="scheduled-payroll">
      <div className="payroll-header">
        <div>
          <h2>� Automated Payroll</h2>
          <p className="payroll-description">
            Set up recurring or one-time payments. Sign once with your wallet to authorize automated payments to multiple recipients.
          </p>
        </div>
        <button
          className="create-schedule-btn"
          onClick={() => {
            setEditingSchedule(null);
            setNewSchedule({
              name: '',
              frequency: 'monthly',
              customInterval: '',
              startDate: '',
              endDate: '',
              duration: '',
              recipients: [{ wallet: '', amount: '', name: '' }],
              autoExecute: false,
              isPaused: false,
              nextPayment: null,
              paymentsCompleted: 0,
            });
            setShowCreateModal(true);
          }}
          disabled={loading}
        >
          + Create Schedule
        </button>
      </div>

      {/* Schedules List */}
      <div className="schedules-list">
        {schedules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">�</div>
            <h3>No Payment Schedules Yet</h3>
            <p>Create your first automated payroll to send ETH on a recurring schedule or specific date</p>
          </div>
        ) : (
          schedules.map((schedule) => (
            <div key={schedule.id} className={`schedule-card ${schedule.isPaused ? 'paused' : ''} ${isPaymentDue(schedule) && !schedule.isPaused ? 'due' : ''}`}>
              <div className="schedule-header-row">
                <div className="schedule-title">
                  <h3>{schedule.name}</h3>
                  {schedule.isApproved && schedule.autoExecute && <span className="status-badge approved">✓ Automated</span>}
                  {schedule.isPaused && <span className="status-badge paused">Paused</span>}
                  {isPaymentDue(schedule) && !schedule.isPaused && <span className="status-badge due">Payment Due</span>}
                </div>
                <div className="schedule-actions">
                  <button
                    className="action-btn edit"
                    onClick={() => handleEditSchedule(schedule)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="action-btn pause"
                    onClick={() => handleTogglePause(schedule)}
                    title={schedule.isPaused ? 'Resume' : 'Pause'}
                  >
                    {schedule.isPaused ? '▶️' : '⏸️'}
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDeleteSchedule(schedule)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="schedule-info">
                <div className="info-row">
                  <span className="info-label">Frequency:</span>
                  <span className="info-value">{getFrequencyLabel(schedule.frequency, schedule.customInterval)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Next Payment:</span>
                  <span className="info-value">{formatDate(schedule.nextPayment)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Recipients:</span>
                  <span className="info-value">{schedule.recipients.length} recipient(s)</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Amount per Payment:</span>
                  <span className="info-value">{calculateTotalPerPayment(schedule.recipients).toFixed(4)} ETH</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Payments Completed:</span>
                  <span className="info-value">
                    {schedule.paymentsCompleted || 0}
                    {schedule.totalPayments !== Infinity && ` / ${schedule.totalPayments}`}
                  </span>
                </div>
              </div>

              <div className="schedule-recipients-preview">
                <h4>Recipients:</h4>
                <div className="recipients-preview-list">
                  {schedule.recipients.map((recipient, index) => (
                    <div key={index} className="recipient-preview-item">
                      <span className="recipient-name">{recipient.name}</span>
                      <span className="recipient-amount">{recipient.amount} ETH</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="execute-btn"
                onClick={() => handleExecutePayroll(schedule)}
                disabled={loading || schedule.isPaused}
              >
                {loading ? 'Processing...' : '💸 Execute Payment Now'}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSchedule ? 'Edit Schedule' : 'Create Scheduled Payroll'}</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              {/* Schedule Name */}
              <div className="form-group">
                <label>Schedule Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Monthly Team Payroll"
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                />
              </div>

              {/* Frequency */}
              <div className="form-group">
                <label>Payment Frequency *</label>
                <select
                  value={newSchedule.frequency}
                  onChange={(e) => setNewSchedule({ ...newSchedule, frequency: e.target.value })}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly (Every 2 weeks)</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom Interval (days)</option>
                  <option value="specific-date">Specific Date (One-time)</option>
                </select>
              </div>

              {/* Custom Interval */}
              {newSchedule.frequency === 'custom' && (
                <div className="form-group">
                  <label>Custom Interval (days) *</label>
                  <input
                    type="number"
                    placeholder="e.g., 15"
                    min="1"
                    value={newSchedule.customInterval}
                    onChange={(e) => setNewSchedule({ ...newSchedule, customInterval: e.target.value })}
                  />
                </div>
              )}

              {/* Specific Date */}
              {newSchedule.frequency === 'specific-date' && (
                <div className="form-group">
                  <label>Payment Date *</label>
                  <input
                    type="datetime-local"
                    value={newSchedule.specificDate}
                    onChange={(e) => setNewSchedule({ ...newSchedule, specificDate: e.target.value })}
                  />
                  <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: '0.5rem'}}>
                    Payment will be executed once on this specific date
                  </p>
                </div>
              )}

              {/* Start Date */}
              {newSchedule.frequency !== 'specific-date' && (
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="datetime-local"
                    value={newSchedule.startDate}
                    onChange={(e) => setNewSchedule({ ...newSchedule, startDate: e.target.value })}
                  />
                </div>
              )}

              {/* Duration Options */}
              {newSchedule.frequency !== 'specific-date' && (
                <div className="form-group">
                  <label>Duration</label>
                  <div className="duration-options">
                    <div className="duration-option">
                      <label>
                        <input
                          type="radio"
                          name="durationType"
                          checked={!newSchedule.duration && !newSchedule.endDate}
                          onChange={() => setNewSchedule({ ...newSchedule, duration: '', endDate: '' })}
                        />
                        Ongoing (no end date)
                      </label>
                  </div>
                  <div className="duration-option">
                    <label>
                      <input
                        type="radio"
                        name="durationType"
                        checked={!!newSchedule.endDate}
                        onChange={() => setNewSchedule({ ...newSchedule, duration: '', endDate: new Date().toISOString().slice(0, 16) })}
                      />
                      End by date
                    </label>
                    {!!newSchedule.endDate && (
                      <input
                        type="datetime-local"
                        value={newSchedule.endDate}
                        onChange={(e) => setNewSchedule({ ...newSchedule, endDate: e.target.value, duration: '' })}
                      />
                    )}
                  </div>
                  <div className="duration-option">
                    <label>
                      <input
                        type="radio"
                        name="durationType"
                        checked={!!newSchedule.duration}
                        onChange={() => setNewSchedule({ ...newSchedule, endDate: '', duration: '12' })}
                      />
                      Number of payments
                    </label>
                    {!!newSchedule.duration && (
                      <input
                        type="number"
                        min="1"
                        value={newSchedule.duration}
                        onChange={(e) => setNewSchedule({ ...newSchedule, duration: e.target.value, endDate: '' })}
                        placeholder="e.g., 12"
                      />
                    )}
                  </div>
                </div>
                </div>
              )}

              {/* Recipients */}
              <div className="form-group">
                <label>Recipients *</label>
                <div className="recipients-list">
                  {newSchedule.recipients.map((recipient, index) => (
                    <div key={index} className="recipient-row">
                      <input
                        type="text"
                        placeholder="Wallet address (0x...)"
                        value={recipient.wallet}
                        onChange={(e) => updateRecipient(index, 'wallet', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Amount (ETH)"
                        value={recipient.amount}
                        onChange={(e) => updateRecipient(index, 'amount', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Name"
                        value={recipient.name}
                        onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                      />
                      <button
                        className="remove-recipient"
                        onClick={() => removeRecipient(index)}
                        disabled={newSchedule.recipients.length === 1}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button className="add-recipient-btn" onClick={addRecipient}>
                  + Add Recipient
                </button>
              </div>

              {/* Total Summary */}
              <div className="schedule-summary">
                <h4>Summary</h4>
                <p>Total per payment: <strong>{calculateTotalPerPayment(newSchedule.recipients).toFixed(4)} ETH</strong></p>
                <p>Recipients: <strong>{newSchedule.recipients.length}</strong></p>
                <p>Frequency: <strong>{getFrequencyLabel(newSchedule.frequency, newSchedule.customInterval)}</strong></p>
              </div>

              {/* Note about automation */}
              {/* Automation Note */}
              <div className="automation-note">
                <p>
                  🔐 <strong>Sign Once, Automate Forever:</strong> When you create this schedule, 
                  you'll sign a message with your wallet to approve automated payments. 
                  Your funds remain in your vault, and payments execute automatically on schedule.
                </p>
                <p style={{marginTop: '0.75rem', fontSize: '0.85rem', opacity: 0.8}}>
                  <strong>Note:</strong> Currently requires manual execution on each payment date. 
                  For fully automated execution, integrate with Chainlink Automation or Gelato Network.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button
                className="save-btn"
                onClick={handleCreateSchedule}
                disabled={loading}
              >
                {loading ? 'Saving...' : (editingSchedule ? 'Update Schedule' : 'Create Schedule')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduledPayroll;
