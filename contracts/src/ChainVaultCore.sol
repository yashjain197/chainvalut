// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Minimal Chainlink Aggregator interface
interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function latestRoundData()
        external
        view
        returns (
            uint80, int256, uint256, uint256, uint80
        );
}

abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status = _NOT_ENTERED;
    modifier nonReentrant() {
        require(_status != _ENTERED, "REENTRANCY");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

contract ChainVaultCore is ReentrancyGuard {
    // ===== Errors =====
    error NotOwner();
    error PausedError();
    error ZeroAmount();
    error InsufficientBalance(uint256 available, uint256 required);
    error TransferFailed();
    error InvalidAddress();
    error PriceFeedNotSet();

    // ===== Ownership & Pause =====
    address public owner;
    bool public paused;

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert PausedError();
        _;
    }

    event OwnerUpdated(address indexed previousOwner, address indexed newOwner);
    event Paused(address indexed by);
    event Unpaused(address indexed by);

    // ===== Accounting =====
    mapping(address => uint256) private _balance;
    uint256 public totalLiabilities;

    function balanceOf(address user) external view returns (uint256) {
        return _balance[user];
    }

    // ===== Optional Price Feed =====
    AggregatorV3Interface public priceFeed;
    event PriceFeedUpdated(address indexed by, address indexed newFeed);

    constructor(address priceFeed_) {
        owner = msg.sender;
        emit OwnerUpdated(address(0), msg.sender);
        if (priceFeed_ != address(0)) {
            priceFeed = AggregatorV3Interface(priceFeed_);
            emit PriceFeedUpdated(msg.sender, priceFeed_);
        }
    }

    function setPriceFeed(address newFeed) external onlyOwner {
        if (newFeed == address(0)) revert InvalidAddress();
        priceFeed = AggregatorV3Interface(newFeed);
        emit PriceFeedUpdated(msg.sender, newFeed);
    }

    function getLatestEthUsd() public view returns (int256 answer, uint8 feedDecimals) {
        if (address(priceFeed) == address(0)) revert PriceFeedNotSet();
        (, int256 a, , , ) = priceFeed.latestRoundData();
        return (a, priceFeed.decimals());
    }

    // ===== Activity & Audit =====
    enum Action { None, Deposit, Withdraw, Payment }

    struct TxRecord {
        uint64 timestamp;
        address from;
        address to;
        Action action;
        uint256 amount;
        uint256 balanceAfter;
        bytes32 ref;
    }

    uint32 public constant HISTORY_SIZE = 100;
    mapping(address => TxRecord[HISTORY_SIZE]) private _history;
    mapping(address => uint32) private _historyNext;
    mapping(address => uint64) private _historyCount;

    event Deposited(address indexed user, uint256 amount, uint256 balanceAfter, bytes32 ref);
    event Withdrawn(address indexed user, address indexed to, uint256 amount, uint256 balanceAfter, bytes32 ref);
    event Paid(address indexed from, address indexed to, uint256 amount, uint256 balanceAfter, bytes32 ref);

    // ===== Admin =====
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        emit OwnerUpdated(owner, newOwner);
        owner = newOwner;
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    // ===== Core: deposit / withdraw / pay =====
    function deposit(bytes32 ref) external payable whenNotPaused nonReentrant {
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

    function withdraw(uint256 amount, address payable to, bytes32 ref)
        external
        whenNotPaused
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

    function pay(address payable to, uint256 amount, bytes32 ref)
        external
        whenNotPaused
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

    function withdrawAll(bytes32 ref) external whenNotPaused nonReentrant {
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

    // ===== History queries =====
    function userHistoryCount(address user) external view returns (uint64) {
        return _historyCount[user];
    }

    function recentHistory(address user) external view returns (TxRecord[] memory out) {
        uint64 total = _historyCount[user];
        uint32 n = HISTORY_SIZE;
        if (total < n) {
            n = uint32(total);
        }
        out = new TxRecord[](n);
        if (n == 0) return out;

        uint32 start = (total >= HISTORY_SIZE) ? _historyNext[user] : 0;
        for (uint32 i = 0; i < n; i++) {
            uint32 idx = (start + i) % HISTORY_SIZE;
            out[i] = _history[user][idx];
        }
    }

    // ===== Internals =====
    function _pushHistory(address user, TxRecord memory rec) internal {
        uint32 i = _historyNext[user];
        _history[user][i] = rec;
        unchecked {
            _historyNext[user] = (i + 1) % HISTORY_SIZE;
            _historyCount[user] += 1;
        }
    }

    receive() external payable { revert("Use deposit()"); }
    fallback() external payable { revert("Use deposit()"); }
}
