// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ChainVaultCore.sol";

/**
 * @title NomineeVault
 * @notice Extended vault with nominee/inheritance functionality for inactive users
 * @dev Integrates with Lit Protocol for encrypted nominee data storage
 * 
 * Key Features:
 * - Users can designate nominees with share percentages
 * - Nominee data encrypted off-chain via Lit Protocol
 * - Inactivity tracking (default 365 days)
 * - Nominees can claim proportional shares after inactivity period
 * - Activity can be manually pinged to reset timer
 */
contract NomineeVault is ChainVaultCore {
    
    // ==================== Structs ====================
    
    struct NomineeData {
        bytes encryptedData;        // Lit Protocol encrypted nominee info
        uint256 totalShares;        // Should always be 100 (representing 100%)
        uint256 nomineeCount;       // Number of nominees
        uint256 claimedAmount;      // Total amount claimed so far
        uint256 balanceSnapshot;    // Balance snapshot at first claim
        bool isActive;              // Whether nominee setup is active
    }
    
    // ==================== State Variables ====================
    
    /// @notice Inactivity period before nominees can claim (default 365 days)
    uint256 public inactivityPeriod = 365 days;
    
    /// @notice Mapping of user address to their last activity timestamp
    mapping(address => uint256) public lastActivity;
    
    /// @notice Mapping of user address to their nominee configuration
    mapping(address => NomineeData) public nomineeConfig;
    
    /// @notice Mapping to track which nominee indices have claimed: user => nomineeIndex => claimed
    mapping(address => mapping(uint256 => bool)) public claimedShares;
    
    /// @notice Mapping to track nominee addresses for validation: user => nominee => isNominee
    mapping(address => mapping(address => bool)) private nomineeRegistry;
    
    /// @notice Mapping to store individual share amounts: user => nomineeIndex => sharePercentage
    mapping(address => mapping(uint256 => uint256)) public nomineeShares;
    
    /// @notice Claims paused by owner
    bool public claimsPaused;
    
    // ==================== Events ====================
    
    event NomineesSet(
        address indexed user,
        bytes encryptedData,
        uint256 nomineeCount,
        uint256 timestamp
    );
    
    event NomineesUpdated(
        address indexed user,
        bytes encryptedData,
        uint256 nomineeCount,
        uint256 timestamp
    );
    
    event NomineesRemoved(
        address indexed user,
        uint256 timestamp
    );
    
    event NomineeClaimed(
        address indexed user,
        address indexed nominee,
        uint256 amount,
        uint256 sharePercentage,
        uint256 nomineeIndex,
        uint256 timestamp
    );
    
    event ActivityPinged(
        address indexed user,
        uint256 timestamp
    );
    
    event InactivityPeriodUpdated(
        uint256 oldPeriod,
        uint256 newPeriod,
        uint256 timestamp
    );
    
    event ClaimsPausedToggled(
        bool paused,
        uint256 timestamp
    );
    
    // ==================== Errors ====================
    
    error InvalidShares(uint256 totalShares);
    error SelfNomination();
    error UserNotInactive(uint256 lastActive, uint256 currentTime);
    error AlreadyClaimed(uint256 nomineeIndex);
    error InvalidNomineeIndex(uint256 index, uint256 maxIndex);
    error NotANominee(address caller);
    error NoNomineesConfigured();
    error ClaimsPaused();
    error InvalidInactivityPeriod();
    error NomineeCountMismatch(uint256 expected, uint256 actual);
    
    // ==================== Modifiers ====================
    
    /**
     * @dev Validates that the user is inactive (exceeded inactivity period)
     */
    modifier onlyInactiveUser(address user) {
        if (block.timestamp <= lastActivity[user] + inactivityPeriod) {
            revert UserNotInactive(lastActivity[user], block.timestamp);
        }
        _;
    }
    
    /**
     * @dev Updates user's last activity timestamp
     */
    modifier updateActivity() {
        _updateLastActivity(msg.sender);
        _;
    }
    
    /**
     * @dev Ensures claims are not paused
     */
    modifier whenClaimsNotPaused() {
        if (claimsPaused) revert ClaimsPaused();
        _;
    }
    
    // ==================== Constructor ====================
    
    constructor(address priceFeed_) ChainVaultCore(priceFeed_) {}
    
    // ==================== Overridden Core Functions (with activity tracking) ====================
    
    /**
     * @notice Deposit ETH into the vault (overridden to track activity)
     * @param ref Reference ID for the transaction
     */
    function deposit(bytes32 ref) external payable override whenNotPaused nonReentrant updateActivity {
        if (msg.value == 0) revert ZeroAmount();
        _balance[msg.sender] += msg.value;
        totalLiabilities += msg.value;

        emit Deposited(msg.sender, msg.value, _balance[msg.sender], ref);
        _pushHistory(msg.sender, TxRecord({
            timestamp: uint64(block.timestamp),
            from: msg.sender,
            to: address(this),
            action: Action.Deposit,
            amount: msg.value,
            balanceAfter: _balance[msg.sender],
            ref: ref
        }));
    }
    
    /**
     * @notice Pay another user (overridden to track activity)
     * @param to Recipient address
     * @param amount Amount to pay
     * @param ref Reference ID for the transaction
     */
    function pay(address payable to, uint256 amount, bytes32 ref) external override whenNotPaused updateActivity nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (to == address(0)) revert InvalidAddress();

        uint256 bal = _balance[msg.sender];
        if (bal < amount) revert InsufficientBalance(bal, amount);

        _balance[msg.sender] = bal - amount;
        totalLiabilities -= amount;

        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit Paid(msg.sender, to, amount, _balance[msg.sender], ref);
        _pushHistory(msg.sender, TxRecord({
            timestamp: uint64(block.timestamp),
            from: msg.sender,
            to: to,
            action: Action.Payment,
            amount: amount,
            balanceAfter: _balance[msg.sender],
            ref: ref
        }));
    }
    
    /**
     * @notice Withdraw ETH (overridden to track activity)
     * @param amount Amount to withdraw
     * @param to Recipient address
     * @param ref Reference ID for the transaction
     */
    function withdraw(uint256 amount, address payable to, bytes32 ref) 
        external 
        override 
        whenNotPaused 
        updateActivity 
        nonReentrant
    {
        if (amount == 0) revert ZeroAmount();
        if (to == address(0)) revert InvalidAddress();

        uint256 bal = _balance[msg.sender];
        if (bal < amount) revert InsufficientBalance(bal, amount);

        _balance[msg.sender] = bal - amount;
        totalLiabilities -= amount;

        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit Withdrawn(msg.sender, to, amount, _balance[msg.sender], ref);
        _pushHistory(msg.sender, TxRecord({
            timestamp: uint64(block.timestamp),
            from: msg.sender,
            to: to,
            action: Action.Withdraw,
            amount: amount,
            balanceAfter: _balance[msg.sender],
            ref: ref
        }));
    }
    
    /**
     * @notice Withdraw all funds (overridden to track activity)
     * @param ref Reference ID for the transaction
     */
    function withdrawAll(bytes32 ref) external override whenNotPaused updateActivity nonReentrant {
        uint256 amount = _balance[msg.sender];
        if (amount == 0) revert ZeroAmount();

        _balance[msg.sender] = 0;
        totalLiabilities -= amount;

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit Withdrawn(msg.sender, msg.sender, amount, _balance[msg.sender], ref);
        _pushHistory(msg.sender, TxRecord({
            timestamp: uint64(block.timestamp),
            from: msg.sender,
            to: msg.sender,
            action: Action.Withdraw,
            amount: amount,
            balanceAfter: _balance[msg.sender],
            ref: ref
        }));
    }
    
    // ==================== Nominee Management Functions ====================
    
    /**
     * @notice Set nominees with encrypted data from Lit Protocol
     * @param encryptedData Encrypted nominee addresses and shares (from Lit Protocol)
     * @param nomineeAddresses Array of nominee addresses (for validation only, not stored)
     * @param shares Array of share percentages (must sum to 100)
     * @dev Off-chain: Encrypt nominee data with Lit SDK before calling
     * @dev On-chain: Only store encrypted bytes for privacy
     */
    function setNominees(
        bytes calldata encryptedData,
        address[] calldata nomineeAddresses,
        uint256[] calldata shares
    ) external whenNotPaused updateActivity {
        if (nomineeAddresses.length != shares.length) {
            revert NomineeCountMismatch(nomineeAddresses.length, shares.length);
        }
        
        // Validate shares sum to 100
        uint256 totalShares = 0;
        for (uint256 i = 0; i < shares.length; i++) {
            if (nomineeAddresses[i] == address(0)) revert InvalidAddress();
            if (nomineeAddresses[i] == msg.sender) revert SelfNomination();
            
            totalShares += shares[i];
            
            // Store nominee registry and shares for validation
            nomineeRegistry[msg.sender][nomineeAddresses[i]] = true;
            nomineeShares[msg.sender][i] = shares[i];
        }
        
        if (totalShares != 100) revert InvalidShares(totalShares);
        
        // Store encrypted nominee data
        nomineeConfig[msg.sender] = NomineeData({
            encryptedData: encryptedData,
            totalShares: 100,
            nomineeCount: nomineeAddresses.length,
            claimedAmount: 0,
            balanceSnapshot: 0,
            isActive: true
        });
        
        emit NomineesSet(msg.sender, encryptedData, nomineeAddresses.length, block.timestamp);
    }
    
    /**
     * @notice Update existing nominees
     * @param encryptedData New encrypted nominee data
     * @param nomineeAddresses New nominee addresses
     * @param shares New share percentages
     */
    function updateNominees(
        bytes calldata encryptedData,
        address[] calldata nomineeAddresses,
        uint256[] calldata shares
    ) external whenNotPaused updateActivity {
        if (!nomineeConfig[msg.sender].isActive) revert NoNomineesConfigured();
        
        // Clear old nominee registry
        NomineeData storage config = nomineeConfig[msg.sender];
        for (uint256 i = 0; i < config.nomineeCount; i++) {
            claimedShares[msg.sender][i] = false;
            nomineeShares[msg.sender][i] = 0;
        }
        
        // Set new nominees (reuse setNominees logic)
        if (nomineeAddresses.length != shares.length) {
            revert NomineeCountMismatch(nomineeAddresses.length, shares.length);
        }
        
        uint256 totalShares = 0;
        for (uint256 i = 0; i < shares.length; i++) {
            if (nomineeAddresses[i] == address(0)) revert InvalidAddress();
            if (nomineeAddresses[i] == msg.sender) revert SelfNomination();
            
            totalShares += shares[i];
            nomineeRegistry[msg.sender][nomineeAddresses[i]] = true;
            nomineeShares[msg.sender][i] = shares[i];
        }
        
        if (totalShares != 100) revert InvalidShares(totalShares);
        
        config.encryptedData = encryptedData;
        config.totalShares = 100;
        config.nomineeCount = nomineeAddresses.length;
        config.claimedAmount = 0;
        config.balanceSnapshot = 0;
        
        emit NomineesUpdated(msg.sender, encryptedData, nomineeAddresses.length, block.timestamp);
    }
    
    /**
     * @notice Remove all nominees
     */
    function removeNominees() external whenNotPaused updateActivity {
        if (!nomineeConfig[msg.sender].isActive) revert NoNomineesConfigured();
        
        NomineeData storage config = nomineeConfig[msg.sender];
        
        // Clear all data
        for (uint256 i = 0; i < config.nomineeCount; i++) {
            claimedShares[msg.sender][i] = false;
            nomineeShares[msg.sender][i] = 0;
        }
        
        delete nomineeConfig[msg.sender];
        
        emit NomineesRemoved(msg.sender, block.timestamp);
    }
    
    // ==================== Nominee Claim Functions ====================
    
    /**
     * @notice Claim nominee share after user inactivity
     * @param user Inactive user's address
     * @param nomineeIndex Index of the nominee in the shares array
     * @dev Nominee must decrypt data off-chain via Lit Protocol first
     * @dev Contract validates inactivity and distributes proportional ETH
     */
    function claimNomineeShare(address user, uint256 nomineeIndex)
        external
        whenNotPaused
        whenClaimsNotPaused
        onlyInactiveUser(user)
        nonReentrant
    {
        NomineeData storage config = nomineeConfig[user];
        
        if (!config.isActive) revert NoNomineesConfigured();
        if (nomineeIndex >= config.nomineeCount) {
            revert InvalidNomineeIndex(nomineeIndex, config.nomineeCount - 1);
        }
        if (claimedShares[user][nomineeIndex]) {
            revert AlreadyClaimed(nomineeIndex);
        }
        if (!nomineeRegistry[user][msg.sender]) {
            revert NotANominee(msg.sender);
        }
        
        // Mark as claimed
        claimedShares[user][nomineeIndex] = true;
        
        // Take balance snapshot on first claim
        if (config.balanceSnapshot == 0) {
            config.balanceSnapshot = _balance[user];
        }
        
        // Calculate claim amount based on snapshot balance
        uint256 sharePercentage = nomineeShares[user][nomineeIndex];
        uint256 claimAmount = (config.balanceSnapshot * sharePercentage) / 100;
        
        if (claimAmount == 0) revert ZeroAmount();
        
        // Update balances
        uint256 currentBalance = _balance[user];
        _balance[user] = currentBalance - claimAmount;
        totalLiabilities -= claimAmount;
        config.claimedAmount += claimAmount;
        
        // Transfer ETH to nominee
        (bool success, ) = payable(msg.sender).call{value: claimAmount}("");
        if (!success) revert TransferFailed();
        
        emit NomineeClaimed(
            user,
            msg.sender,
            claimAmount,
            sharePercentage,
            nomineeIndex,
            block.timestamp
        );
    }
    
    /**
     * @notice Manually ping activity to reset inactivity timer
     * @param ref Reference ID for the ping
     * @dev Allows users to maintain "alive" status without moving funds
     */
    function pingActivity(bytes32 ref) external whenNotPaused updateActivity {
        emit ActivityPinged(msg.sender, block.timestamp);
    }
    
    // ==================== View Functions ====================
    
    /**
     * @notice Get encrypted nominee data for a user
     * @param user User address
     * @return Encrypted nominee data bytes
     */
    function getEncryptedNomineeData(address user) external view returns (bytes memory) {
        return nomineeConfig[user].encryptedData;
    }
    
    /**
     * @notice Check if user is inactive
     * @param user User address
     * @return True if user is inactive (exceeded inactivity period)
     */
    function isUserInactive(address user) external view returns (bool) {
        return block.timestamp > lastActivity[user] + inactivityPeriod;
    }
    
    /**
     * @notice Get time until user becomes inactive
     * @param user User address
     * @return Time in seconds (0 if already inactive)
     */
    function timeUntilInactive(address user) external view returns (uint256) {
        uint256 inactiveTime = lastActivity[user] + inactivityPeriod;
        if (block.timestamp >= inactiveTime) return 0;
        return inactiveTime - block.timestamp;
    }
    
    /**
     * @notice Get nominee configuration for a user
     * @param user User address
     * @return NomineeData struct
     */
    function getNomineeConfig(address user) external view returns (NomineeData memory) {
        return nomineeConfig[user];
    }
    
    /**
     * @notice Check if a nominee index has been claimed
     * @param user User address
     * @param nomineeIndex Index to check
     * @return True if claimed
     */
    function isShareClaimed(address user, uint256 nomineeIndex) external view returns (bool) {
        return claimedShares[user][nomineeIndex];
    }
    
    /**
     * @notice Get share percentage for a nominee index
     * @param user User address
     * @param nomineeIndex Nominee index
     * @return Share percentage (0-100)
     */
    function getNomineeShare(address user, uint256 nomineeIndex) external view returns (uint256) {
        return nomineeShares[user][nomineeIndex];
    }
    
    // ==================== Admin Functions ====================
    
    /**
     * @notice Update inactivity period
     * @param newPeriod New inactivity period in seconds
     */
    function setInactivityPeriod(uint256 newPeriod) external onlyOwner {
        if (newPeriod < 30 days || newPeriod > 730 days) {
            revert InvalidInactivityPeriod();
        }
        
        uint256 oldPeriod = inactivityPeriod;
        inactivityPeriod = newPeriod;
        
        emit InactivityPeriodUpdated(oldPeriod, newPeriod, block.timestamp);
    }
    
    /**
     * @notice Pause or unpause nominee claims
     * @param paused True to pause, false to unpause
     */
    function setClaimsPaused(bool paused) external onlyOwner {
        claimsPaused = paused;
        emit ClaimsPausedToggled(paused, block.timestamp);
    }
    
    // ==================== Internal Functions ====================
    
    /**
     * @dev Internal function to update last activity timestamp
     */
    function _updateLastActivity(address user) internal {
        lastActivity[user] = block.timestamp;
    }
}
