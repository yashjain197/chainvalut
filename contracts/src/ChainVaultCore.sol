// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ChainVaultCore
 * @notice Base vault contract for ETH deposits, payments, and withdrawals
 * @dev Handles basic vault functionality with Chainlink price feeds
 */
contract ChainVaultCore is Ownable, Pausable, ReentrancyGuard {
    
    // ==================== Structs ====================
    
    struct TxRecord {
        uint256 timestamp;
        uint256 amount;
        address counterparty;
        string txType; // "DEPOSIT", "PAYMENT", "WITHDRAW"
        bytes32 ref;
    }
    
    // ==================== State Variables ====================
    
    mapping(address => uint256) private balances;
    mapping(address => TxRecord[]) private history;
    
    uint256 public constant MAX_HISTORY_SIZE = 100;
    
    // ==================== Events ====================
    
    event Deposited(address indexed user, uint256 amount, bytes32 ref, uint256 timestamp);
    event Paid(address indexed from, address indexed to, uint256 amount, bytes32 ref, uint256 timestamp);
    event Withdrawn(address indexed user, uint256 amount, address to, bytes32 ref, uint256 timestamp);
    
    // ==================== Errors ====================
    
    error InsufficientBalance(uint256 requested, uint256 available);
    error InvalidAmount();
    error TransferFailed();
    error InvalidAddress();
    
    // ==================== Constructor ====================
    
    constructor() Ownable(msg.sender) {}
    
    // ==================== Core Functions ====================
    
    /**
     * @notice Deposit ETH into the vault
     * @param ref Reference ID for the transaction
     */
    function deposit(bytes32 ref) external payable virtual whenNotPaused {
        if (msg.value == 0) revert InvalidAmount();
        
        balances[msg.sender] += msg.value;
        
        _addHistory(
            msg.sender,
            TxRecord({
                timestamp: block.timestamp,
                amount: msg.value,
                counterparty: msg.sender,
                txType: "DEPOSIT",
                ref: ref
            })
        );
        
        emit Deposited(msg.sender, msg.value, ref, block.timestamp);
    }
    
    /**
     * @notice Pay another user from your vault balance
     * @param to Recipient address
     * @param amount Amount to pay
     * @param ref Reference ID for the transaction
     */
    function pay(address to, uint256 amount, bytes32 ref) external virtual whenNotPaused nonReentrant {
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (balances[msg.sender] < amount) {
            revert InsufficientBalance(amount, balances[msg.sender]);
        }
        
        balances[msg.sender] -= amount;
        balances[to] += amount;
        
        _addHistory(
            msg.sender,
            TxRecord({
                timestamp: block.timestamp,
                amount: amount,
                counterparty: to,
                txType: "PAYMENT",
                ref: ref
            })
        );
        
        _addHistory(
            to,
            TxRecord({
                timestamp: block.timestamp,
                amount: amount,
                counterparty: msg.sender,
                txType: "RECEIVED",
                ref: ref
            })
        );
        
        emit Paid(msg.sender, to, amount, ref, block.timestamp);
    }
    
    /**
     * @notice Withdraw ETH from vault to an address
     * @param amount Amount to withdraw
     * @param to Recipient address
     * @param ref Reference ID for the transaction
     */
    function withdraw(uint256 amount, address payable to, bytes32 ref) external virtual whenNotPaused nonReentrant {
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (balances[msg.sender] < amount) {
            revert InsufficientBalance(amount, balances[msg.sender]);
        }
        
        balances[msg.sender] -= amount;
        
        _addHistory(
            msg.sender,
            TxRecord({
                timestamp: block.timestamp,
                amount: amount,
                counterparty: to,
                txType: "WITHDRAW",
                ref: ref
            })
        );
        
        (bool success, ) = to.call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit Withdrawn(msg.sender, amount, to, ref, block.timestamp);
    }
    
    /**
     * @notice Withdraw all funds from vault
     * @param ref Reference ID for the transaction
     */
    function withdrawAll(bytes32 ref) external virtual whenNotPaused nonReentrant {
        uint256 amount = balances[msg.sender];
        if (amount == 0) revert InvalidAmount();
        
        balances[msg.sender] = 0;
        
        _addHistory(
            msg.sender,
            TxRecord({
                timestamp: block.timestamp,
                amount: amount,
                counterparty: msg.sender,
                txType: "WITHDRAW",
                ref: ref
            })
        );
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit Withdrawn(msg.sender, amount, msg.sender, ref, block.timestamp);
    }
    
    // ==================== View Functions ====================
    
    /**
     * @notice Get balance of a user
     * @param user User address
     * @return User's balance
     */
    function balanceOf(address user) public view returns (uint256) {
        return balances[user];
    }
    
    /**
     * @notice Get recent transaction history for a user
     * @param user User address
     * @return Array of transaction records
     */
    function recentHistory(address user) external view returns (TxRecord[] memory) {
        return history[user];
    }
    
    /**
     * @notice Mock function for Chainlink ETH/USD price feed
     * @return Latest ETH/USD price (mock value: $2000)
     */
    function getLatestEthUsd() external pure returns (uint256) {
        // Mock implementation - replace with actual Chainlink integration
        return 2000 * 10**8; // $2000 with 8 decimals
    }
    
    // ==================== Internal Functions ====================
    
    /**
     * @dev Add transaction to history (internal)
     */
    function _addHistory(address user, TxRecord memory record) internal {
        if (history[user].length >= MAX_HISTORY_SIZE) {
            // Remove oldest entry
            for (uint256 i = 0; i < history[user].length - 1; i++) {
                history[user][i] = history[user][i + 1];
            }
            history[user].pop();
        }
        history[user].push(record);
    }
    
    /**
     * @dev Internal function to update balance (used by NomineeVault)
     */
    function _updateBalance(address user, uint256 newBalance) internal {
        balances[user] = newBalance;
    }
    
    /**
     * @dev Internal function to get balance (used by NomineeVault)
     */
    function _getBalance(address user) internal view returns (uint256) {
        return balances[user];
    }
    
    // ==================== Admin Functions ====================
    
    /**
     * @notice Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Receive ETH
     */
    receive() external payable {}
}
