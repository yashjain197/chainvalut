# ChainVault User Guide

> **Complete guide for using ChainVault's P2P lending platform**

## Table of Contents
1. [Getting Started](#getting-started)
2. [Managing Your Vault](#managing-your-vault)
3. [P2P Lending](#p2p-lending)
4. [Payroll Management](#payroll-management)
5. [Chat & Communication](#chat--communication)
6. [Security Best Practices](#security-best-practices)
7. [FAQ](#faq)

---

## Getting Started

### What is ChainVault?

ChainVault is a decentralized peer-to-peer lending platform that allows you to:
- Deposit and manage ETH securely
- Lend money to other users with customizable interest rates
- Borrow funds directly from other users
- Send payments to multiple recipients (payroll)
- Chat with other users privately

### Prerequisites

Before using ChainVault, you'll need:

1. **Web3 Wallet**
   - MetaMask (recommended)
   - WalletConnect-compatible wallet
   - Coinbase Wallet, Rainbow, etc.

2. **Testnet ETH (Sepolia)**
   - Get free test ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
   - Minimum: 0.01 ETH to cover gas fees

3. **Supported Browser**
   - Chrome, Firefox, Edge, or Brave
   - Mobile browsers with wallet support

---

### Connecting Your Wallet

1. **Launch ChainVault**
   ```
   https://chainvault-app.web.app
   ```

2. **Click "Connect Wallet"**
   - The button is in the top-right corner

3. **Choose Your Wallet**
   - MetaMask: Click "MetaMask" icon
   - WalletConnect: Scan QR code with your mobile wallet
   - Other: Select from available options

4. **Approve Connection**
   - Review the connection request
   - Click "Connect" or "Approve"
   - Switch to Sepolia network if prompted

5. **Verify Connection**
   - Your address should appear in the top-right
   - Balance cards should show your ETH balances

---

## Managing Your Vault

### Understanding Your Balances

ChainVault shows two balances:

**Vault Balance** 💰
- ETH stored inside ChainVault smart contract
- Used for lending, borrowing, and payments
- Safe and secure (smart contract holds funds)

**Wallet Balance** 👛
- ETH in your connected wallet
- Used to deposit into vault
- Pay gas fees from here

---

### Depositing ETH

**Why Deposit?**
- Required before lending or borrowing
- Instant transfers between vault users
- Lower gas fees for internal transfers

**Steps:**

1. **Navigate to Action Panel**
   - Find the "Deposit/Withdraw/Pay" section

2. **Enter Amount**
   ```
   Amount: 1.0 ETH
   ```

3. **Click "Deposit ETH"**
   - MetaMask will open
   - Review transaction details
   - Confirm the transaction

4. **Wait for Confirmation**
   - Transaction typically takes 15-30 seconds
   - Success notification will appear
   - Vault balance updates automatically

**Example:**
```
Wallet Balance:  5.0 ETH
Amount to Deposit: 2.0 ETH
After Deposit:
  Vault Balance: 2.0 ETH
  Wallet Balance: ~2.99 ETH (gas fee deducted)
```

---

### Withdrawing ETH

**When to Withdraw:**
- Move funds back to your wallet
- Cash out profits
- Transfer to another address

**Steps:**

1. **Switch to Withdraw Tab**
   - Click "Withdraw" in Action Panel

2. **Enter Details**
   ```
   Amount: 1.0 ETH
   Recipient: 0x123... (or your address)
   ```

3. **Click "Withdraw ETH"**
   - Confirm transaction in MetaMask

4. **Receive Funds**
   - ETH sent to recipient address
   - Updates in 15-30 seconds

**Important:**
- You can only withdraw what you have in vault
- Gas fees paid from wallet balance
- Withdrawals to external addresses cost more gas

---

### Paying Other Users

**Use Cases:**
- Repay loans
- Send money to friends
- Pay for services

**Advantages:**
- **Free**: No gas fees! (internal transfer)
- **Instant**: Funds available immediately
- **Simple**: Just enter address and amount

**Steps:**

1. **Switch to Pay Tab**
   - Click "Pay" in Action Panel

2. **Enter Details**
   ```
   Recipient: 0x456...
   Amount: 0.5 ETH
   ```

3. **Click "Pay"**
   - Confirm in MetaMask
   - Transaction completes instantly

4. **Verification**
   - Check transaction history
   - Recipient's vault balance updates

---

## P2P Lending

### Lending Money

**Create a Lending Offer:**

1. **Navigate to Lending Marketplace**
   - Click "Lending" in navigation

2. **Fill Offer Form**
   ```
   Amount to Lend: 1.5 ETH
   Interest Rate: 5%
   Duration: 30 days
   ```

3. **Click "Create Offer"**
   - Offer appears in marketplace
   - Other users can see and accept

4. **Wait for Borrower**
   - You'll be notified when someone accepts
   - Funds automatically transferred

**Interest Calculation:**
```
Loan Amount: 1.5 ETH
Interest Rate: 5%
Duration: 30 days

Interest Earned: 1.5 × 0.05 = 0.075 ETH
Total Repayment: 1.575 ETH

If borrower repays on time:
  You receive: 1.575 ETH (5% profit)
```

---

### Borrowing Money

**Accept a Lending Offer:**

1. **Browse Offers**
   - View available loans in marketplace
   - Filter by amount, rate, duration

2. **Select an Offer**
   ```
   Lender: Alice (0x123...)
   Amount: 1.5 ETH
   Rate: 5%
   Duration: 30 days
   Repayment: 1.575 ETH
   ```

3. **Click "Borrow"**
   - Confirm transaction
   - Funds added to your vault instantly

4. **Track Your Loan**
   - View in "Active Loans" section
   - Monitor due date
   - Repay anytime

---

### Repaying Loans

**On-Time Repayment:**

1. **Check Active Loans**
   - View loan details and due date
   ```
   Loan: 1.5 ETH borrowed from Alice
   Interest: 0.075 ETH
   Total Due: 1.575 ETH
   Due Date: Nov 25, 2025
   Days Left: 15
   ```

2. **Ensure Sufficient Balance**
   - Vault balance must have 1.575 ETH
   - Deposit more if needed

3. **Click "Repay Loan"**
   - Automatic calculation
   - Confirm transaction

4. **Loan Completed**
   - Funds transferred to lender
   - Loan marked as "Completed"
   - Good reputation for future borrows

**Late Repayment:**
```
⚠️ Warning: Loan overdue by 5 days
Your reputation score may be affected
Please repay as soon as possible
```

---

### Managing Offers

**Cancel an Offer:**
```
1. Go to "Your Lending Offers"
2. Click "Cancel" on the offer
3. Confirm transaction
4. Funds remain in your vault
```

**Edit an Offer:**
```
Currently not supported - cancel and create new offer
```

---

## Payroll Management

### What is Payroll?

Send ETH to multiple recipients in one click:
- Pay your team members
- Distribute rewards
- Send allowances

**Benefits:**
- Batch processing (multiple payments at once)
- CSV import for large teams
- Save templates for recurring payments
- Transaction tracking

---

### Creating a Payment Batch

**Manual Entry:**

1. **Navigate to Payroll**
   - Click "Payroll" in navigation

2. **Enter Recipients**
   ```
   Recipient 1:
     Name: Alice
     Address: 0x123...
     Amount: 0.5 ETH
   
   Recipient 2:
     Name: Bob
     Address: 0x456...
     Amount: 0.3 ETH
   ```

3. **Click "Add Recipient"** for each entry

4. **Review Summary**
   ```
   Total Recipients: 2
   Total Amount: 0.8 ETH
   Your Vault Balance: 2.0 ETH ✓
   ```

5. **Click "Execute Payment"**
   - Confirm each transaction
   - Wait 3-5 seconds between payments
   - All recipients receive funds

---

### CSV Import

**Format:**
```csv
name,wallet,amount
Alice,0x1234567890123456789012345678901234567890,0.5
Bob,0xabcdefabcdefabcdefabcdefabcdefabcdefabcd,0.3
Charlie,0x9876543210987654321098765432109876543210,0.2
```

**Steps:**

1. **Create CSV File**
   - Use Excel, Google Sheets, or text editor
   - Follow format above exactly
   - Save as `.csv`

2. **Import in ChainVault**
   - Click "Import CSV"
   - Select your file
   - Preview recipients

3. **Verify Data**
   ```
   ✓ 3 recipients loaded
   ✓ Total amount: 1.0 ETH
   ✓ All addresses valid
   ```

4. **Execute Batch**
   - Click "Execute Payment"
   - Confirm transactions

---

### Saving Payment Templates

**Why Save Batches?**
- Recurring payments (monthly salaries)
- Repeat same group of recipients
- Quick access to templates

**Steps:**

1. **Create Payment Batch**
   - Add all recipients

2. **Enter Batch Name**
   ```
   Batch Name: Monthly Team Payment
   ```

3. **Click "Save Batch"**
   - Stored in Firebase
   - Access anytime

4. **Load Saved Batch**
   - Select from dropdown
   - Recipients auto-populated
   - Edit if needed
   - Execute payment

---

## Chat & Communication

### Starting a Conversation

1. **Find User**
   - View their profile or offer
   - Click "Chat" button

2. **Send Message**
   ```
   "Hi! I'm interested in your lending offer."
   ```

3. **Real-time Updates**
   - Messages appear instantly
   - No need to refresh

---

### Features

**Text Messages**
- Standard chat messaging
- Emoji support 😊

**Transaction Links**
- Share transaction hashes
- Click to view on Blockscout

**Notifications**
- Unread message count
- Desktop notifications (if enabled)

---

## Security Best Practices

### Wallet Security

✅ **Do:**
- Use hardware wallets (Ledger, Trezor)
- Enable 2FA on wallet
- Verify contract addresses
- Review all transactions before confirming
- Keep seed phrase offline

❌ **Don't:**
- Share your private keys
- Use public WiFi without VPN
- Click suspicious links
- Approve unlimited token allowances
- Store seed phrase digitally

---

### Smart Contract Safety

**Verify Before Transacting:**

1. **Check Contract Address**
   ```
   ChainVault Core: 0xE6f6139929D658d31c5301F02bD8F5cE0b12Ffa4
   Network: Sepolia Testnet (Chain ID: 11155111)
   ```

2. **View on Blockscout**
   ```
   https://eth-sepolia.blockscout.com/address/
   0xE6f6139929D658d31c5301F02bD8F5cE0b12Ffa4
   ```

3. **Verify Code**
   - Contract is verified ✓
   - Source code publicly available
   - Security audited

---

### Lending Safety

**For Lenders:**
- Start with small amounts
- Check borrower's reputation
- Set realistic interest rates
- Monitor loan status

**For Borrowers:**
- Only borrow what you can repay
- Understand interest calculation
- Track due dates
- Repay on time to build reputation

---

## FAQ

### General

**Q: Is ChainVault safe?**
A: Yes! ChainVault uses:
- Audited smart contracts
- ReentrancyGuard protection
- Checks-Effects-Interactions pattern
- Open-source code

**Q: What are the fees?**
A: 
- Deposits: Gas fees only (~$1-5)
- Withdrawals: Gas fees only
- Internal transfers (Pay): FREE!
- Lending: No platform fees, 100% interest to lender

**Q: Which networks are supported?**
A: Currently Sepolia testnet. Mainnet coming soon!

---

### Deposits & Withdrawals

**Q: How long does a deposit take?**
A: 15-30 seconds for transaction confirmation.

**Q: Can I withdraw to a different address?**
A: Yes! Enter any valid Ethereum address as recipient.

**Q: What's the minimum deposit?**
A: No minimum, but consider gas fees (usually $1-5).

---

### Lending & Borrowing

**Q: What happens if borrower doesn't repay?**
A: Currently, loans are trust-based. Future updates will include:
- Collateral system
- Reputation scores
- Dispute resolution

**Q: Can I repay a loan early?**
A: Yes! Repay anytime before due date.

**Q: How is interest calculated?**
A: Simple interest: `Principal × Rate × (Duration/365)`

**Q: Can I cancel a lending offer?**
A: Yes, as long as nobody has accepted it yet.

---

### Payroll

**Q: Do I pay multiple gas fees for batch payments?**
A: Yes, each recipient requires one transaction (one gas fee each).

**Q: What's the delay between payments?**
A: 3-5 seconds to ensure blockchain state settles.

**Q: Can I schedule future payments?**
A: Not yet, but coming soon!

---

### Technical

**Q: Which wallets are supported?**
A: Any WalletConnect-compatible wallet:
- MetaMask
- Coinbase Wallet
- Rainbow
- Trust Wallet
- Ledger
- And more!

**Q: Can I use ChainVault on mobile?**
A: Yes! Fully responsive on mobile browsers with wallet apps.

**Q: Is my data private?**
A: Yes! Chat messages can be encrypted with Lit Protocol.

---

### Troubleshooting

**Q: MetaMask not opening?**
A: 
1. Ensure MetaMask is unlocked
2. Refresh the page
3. Clear browser cache
4. Try different browser

**Q: Transaction failed?**
A: Common causes:
- Insufficient funds
- Too low gas limit
- Network congestion
- Try increasing gas fee

**Q: Balance not updating?**
A:
1. Wait 30 seconds for confirmation
2. Refresh the page
3. Check transaction on Blockscout

---

## Support

### Getting Help

**Documentation:**
- [Technical Documentation](./TECHNICAL_DOCUMENTATION.md)
- [Development Attribution](./DEVELOPMENT_ATTRIBUTION.md)
- [GitHub Repository](https://github.com/ivocreates/chainvalut)

**Community:**
- GitHub Issues: Report bugs
- GitHub Discussions: Ask questions
- Twitter: @chainvault (coming soon)

**Contact:**
- Email: support@chainvault.app (coming soon)
- Discord: [Join Server](https://discord.gg/chainvault) (coming soon)

---

### Reporting Issues

**Bug Report Template:**
```
**Description:**
[Describe the issue]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [...]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Environment:**
- Browser: Chrome 120
- Wallet: MetaMask 11.5
- Network: Sepolia
- Address: 0x123... (optional)
```

---

## Glossary

**Terms:**

- **Vault Balance**: ETH stored in ChainVault smart contract
- **Wallet Balance**: ETH in your connected wallet
- **Gas Fee**: Network fee for Ethereum transactions
- **Internal Transfer**: Payment between vault users (free)
- **External Transfer**: Payment to non-vault address (gas fee)
- **Smart Contract**: Self-executing code on blockchain
- **Testnet**: Testing blockchain (Sepolia)
- **Mainnet**: Live Ethereum network (coming soon)
- **Wei**: Smallest ETH unit (1 ETH = 10^18 wei)

---

## Quick Reference

### Key Addresses

```
ChainVault Core Contract:
0xE6f6139929D658d31c5301F02bD8F5cE0b12Ffa4

Network: Sepolia Testnet
Chain ID: 11155111

Block Explorer:
https://eth-sepolia.blockscout.com/
```

### CSV Format

```csv
name,wallet,amount
Alice,0x1234...5678,0.5
Bob,0xabcd...efgh,0.3
```

### Gas Estimates

```
Deposit:    ~50,000 gas (~$1-5)
Withdraw:   ~55,000 gas (~$1-5)
Pay (internal): ~40,000 gas (~$1-3)
Borrow:     ~80,000 gas (~$2-8)
Repay:      ~70,000 gas (~$2-7)
```

---

*Last Updated: October 26, 2025*
*Version: 2.0.0*

**Happy Lending! 💰**
