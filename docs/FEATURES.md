# ChainVault Complete Features Guide

> Comprehensive documentation of all features, functionality, and use cases

---

## Table of Contents

1. [Core Features](#core-features)
2. [Vault Management](#vault-management)
3. [P2P Lending Marketplace](#p2p-lending-marketplace)
4. [Payroll Management](#payroll-management)
5. [Nominee Inheritance System](#nominee-inheritance-system)
6. [Encrypted Chat](#encrypted-chat)
7. [User Profiles](#user-profiles)
8. [Transaction History](#transaction-history)
9. [Advanced Features](#advanced-features)
10. [Use Cases](#use-cases)

---

## Core Features

### Multi-Contract Architecture

ChainVault integrates two powerful smart contracts on Sepolia testnet:

**ChainVaultCore** (`0xD4b6dA7689a0f392Dec8Ca3959E5f67e95abd2A7`)
- Basic vault operations (deposit, withdraw, pay)
- Payment functionality
- Balance tracking
- ETH/USD price oracle integration
- Payroll batch payments

**NomineeVault** (`0xE6f6139929D658d31c5301F02bD8F5cE0b12Ffa4`) *[Default]*
- All ChainVaultCore functionality
- Nominee inheritance system
- Activity tracking
- Inactivity detection
- Beneficiary claim management

### Wallet Connection

**Supported Wallets:**
- MetaMask
- WalletConnect (Mobile & Desktop)
- Coinbase Wallet
- Rainbow Wallet
- Trust Wallet
- Ledger & Trezor (Hardware wallets)
- And 100+ more!

**Network:**
- Sepolia Testnet (ETH)

---

## Vault Management

### Deposit ETH

1. Connect your wallet
2. Enter amount to deposit
3. Click "Deposit ETH"
4. Confirm transaction
5. Funds safely stored in smart contract

**Features:**
- Minimum deposit: 0.001 ETH
- Instant confirmation
- Real-time balance updates
- USD value display via Chainlink

### Withdraw ETH

1. Enter withdrawal amount
2. Specify recipient address
3. Click "Withdraw ETH"
4. Confirm transaction

**Options:**
- Withdraw to self or any address
- Partial or full withdrawal
- Transaction history tracking

### Pay (Internal Transfer)

1. Enter recipient wallet address
2. Enter amount
3. Click "Pay"
4. Instant internal transfer

**Benefits:**
- Lower gas fees vs ETH transfer
- Perfect for team payments
- Instant settlement

---

## P2P Lending Marketplace

### Create Lending Offer

**As a Lender:**
1. Navigate to Lending Marketplace
2. Click "Create Offer"
3. Fill in details:
   - Amount (ETH)
   - Interest Rate (%)
   - Duration (days)
   - Description (optional)
4. Click "Create Offer"

**Example:**
```
Amount: 1.5 ETH
Interest Rate: 5%
Duration: 30 days
Total Repayment: 1.506 ETH
```

### Browse & Request Loans

**As a Borrower:**
1. Browse lending offers
2. Click "Request Loan"
3. Fill in reason and collateral (optional)
4. Send request to lender via chat

### Accept/Reject Loan Request

**As a Lender:**
1. Receive request notification
2. Click "View Request" in chat
3. Review borrower details
4. Choose:
   - ✅ Accept & Fund → Navigate to payment page
   - ❌ Reject → Notify borrower

### Active Loan Management

**Repayment Options:**

#### 💰 Repay Full Loan
- Pay complete amount
- Loan marked completed

#### 📊 Pay Installment
- Make partial payment
- Payment history tracked
- Remaining balance updated

#### ⏰ Request Extension
- Request additional days
- Provide reason (optional)
- Lender receives notification

**Loan Status Display:**
- Original amount
- Interest rate
- Total repayment
- Remaining balance
- Paid installments
- Due date countdown
- 🔴 OVERDUE badge (if late)

---

## Payroll Management

### Overview

Batch payments to multiple recipients with a single transaction.

### Add Recipients

1. Navigate to Payroll Management
2. Click "Add Recipient"
3. Fill in:
   - Wallet Address
   - Amount (ETH)
   - Name (optional)
4. Click "Add to Payroll"

**Example List:**
```
John Doe (Developer)     1.5 ETH
Jane Smith (Designer)    1.2 ETH
Bob Johnson (Marketing)  1.0 ETH
───────────────────────────────
Total: 3.7 ETH
```

### Execute Batch Payment

**Single-Transaction Payment:**
1. Review recipient list
2. Check total amount
3. Click "Pay All Recipients"
4. Only 2 MetaMask signatures required:
   - Signature 1: Add recipients to contract
   - Signature 2: Execute batch payment
5. All recipients paid simultaneously

**Features:**
- Gas efficient
- Atomic execution (all succeed or all fail)
- Transaction reference for tracking

### Manage Recipients

- Edit payment amounts
- Update recipient names
- Remove recipients
- Changes saved on-chain

### Scheduled Payments

**Setup Recurring Schedule:**
1. Configure payroll recipients
2. Set payment frequency:
   - Weekly
   - Bi-weekly
   - Monthly
   - Custom interval
3. Set start date
4. Enable automation (optional)

**Automation Options:**
- Manual execution (click "Pay All")
- Chainlink Automation (fully automated)
- Custom backend (node-cron)

---

## Nominee Inheritance System

### Setup Nominees

**Designate Beneficiaries:**
1. Navigate to Advanced → Nominee Management
2. Click "Add Nominee"
3. For each nominee:
   - Wallet Address
   - Share Percentage (%)
   - Name (optional)
4. Total shares must equal 100%
5. Click "Save Nominees"

**Example:**
```
Spouse:   50%
Child 1:  25%
Child 2:  25%
──────────────
Total:   100% ✓
```

**Rules:**
- Maximum 10 nominees
- Total shares = 100%
- Cannot nominate yourself
- Unique addresses only

### Inactivity Period

**Default:** 6 months (180 days)

**What Counts as Activity:**
- Deposit/Withdraw ETH
- Make payment
- Accept/fund loan
- Execute payroll
- Manual activity ping

**Automatic Tracking:**
- Every transaction updates timestamp
- No manual intervention needed

### Manual Activity Ping

1. Navigate to Nominee Management
2. Click "Ping Activity"
3. Confirm transaction
4. Inactivity timer resets

### Nominee Claim Process

**When Nominees Can Claim:**
- User is inactive (past threshold)
- Nominee is designated
- User has vault balance

**Claim Steps:**
1. Check if user is inactive
2. Navigate to Claim page
3. Enter inactive user's address
4. Click "Claim My Share"
5. Receive designated percentage

**Example:**
```
User Balance: 10 ETH
Your Share: 25%
Claim Amount: 2.5 ETH
```

---

## Encrypted Chat

### Peer-to-Peer Messaging

**Features:**
- Real-time delivery
- Read receipts
- Message timestamps
- ENS name resolution

**Message Types:**
- Text messages
- Loan requests
- Loan status updates
- Repayment confirmations
- Extension requests

### View Request Button

**Enhanced Borrow Requests:**
- "View Request" button in chat
- Detailed modal with:
  - Borrower information
  - Loan details
  - Accept/Reject buttons

---

## User Profiles

### Profile Information

**Customize:**
- Display Name
- Bio
- Avatar URL
- Email
- Location
- Website

**Social Links:**
- Twitter/X
- GitHub
- Telegram
- Discord

### ENS Integration

- Automatic ENS resolution
- Display names instead of addresses
- Reverse lookup

### EFP (Ethereum Follow Protocol)

- Follower/following count
- Social reputation
- Profile verification

---

## Transaction History

### View History

**Transaction Log:**
- All deposits, withdrawals, payments
- Date and time
- Amount (ETH)
- From/To addresses
- Transaction type
- Reference ID

### Transaction Details

**Click any transaction:**
- Full transaction hash
- Block number
- Confirmations
- Gas used
- Status (success/failed)
- **View on Blockscout** link

**Blockscout Integration:**
- Open-source blockchain explorer
- Detailed transaction info
- Address details
- Contract interactions

---

## Advanced Features

### Price Oracle (Chainlink)

**ETH/USD Conversion:**
- Real-time price feed
- Decentralized oracle
- Display USD values
- Portfolio tracking

### Lit Protocol Encryption

**Private Data:**
- Encrypt sensitive information
- Nominee details
- Loan terms
- Private messages

**Access Control:**
- Owner-only decryption
- Two-party access
- Token-gated access
- Time-locked reveals

### Blockscout Widget

**Recent Activity:**
- Latest 5 transactions
- Status indicators
- Click to view details
- "View All" link

### Security Features

**Smart Contract:**
- ReentrancyGuard protection
- Checks-Effects-Interactions pattern
- Custom errors (gas optimization)
- Emergency pause function

**Frontend:**
- Input validation
- Address verification
- Transaction verification
- Rate limiting

---

## Use Cases

### For Individuals

1. **Personal Savings**
   - Secure ETH storage
   - Earn interest by lending
   - Automated inheritance

2. **Emergency Loans**
   - Quick access to capital
   - P2P lending rates
   - Flexible repayment

3. **Estate Planning**
   - Designate beneficiaries
   - Automatic claims
   - Configurable timelines

### For Teams

1. **Team Payments**
   - Batch payroll execution
   - Lower transaction costs
   - Scheduled distributions

2. **Project Funding**
   - Shared vault
   - Controlled withdrawals
   - Transparent accounting

3. **Contractor Payments**
   - Recurring payments
   - Multiple recipients
   - Payment history

### For Businesses

1. **Business Continuity**
   - Nominee setup for partners
   - Inactivity contingencies
   - Automatic transfers

2. **Employee Compensation**
   - Salary payments in crypto
   - Bonus distributions
   - Commission payouts

3. **Vendor Payments**
   - Scheduled payments
   - Batch processing
   - Cost optimization

---

## Future Enhancements

**Phase 1: Core Improvements**
- Multi-chain support
- Mainnet deployment
- Enhanced analytics
- Reputation system

**Phase 2: Advanced DeFi**
- Yield farming
- Staking rewards
- Liquidity pools
- NFT collateral

**Phase 3: Social & Governance**
- DAO governance
- Community voting
- Referral rewards
- Loyalty programs

**Phase 4: Enterprise**
- Multi-signature wallets
- Advanced access control
- Compliance tools
- API integrations

---

*Last Updated: October 26, 2025*
