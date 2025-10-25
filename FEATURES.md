# ChainVault - New Features Documentation

## 🆕 Latest Updates

### Dual Contract Integration
The dapp now fully integrates two smart contracts on Sepolia testnet:

1. **ChainVaultCore** (`0x4Bb25877b98782B0c15CE79119c37a7ea84A986f`)
   - Basic vault operations: deposit, withdraw, withdrawAll
   - Payment functionality
   - Balance tracking
   - ETH/USD price oracle integration

2. **NomineeVault** (`0x73C46FFa37fabb905689688Bd0138c02438413Cf`)
   - Inherits all ChainVaultCore functionality
   - **Nominee Inheritance System**: Set beneficiaries who can claim funds if you become inactive
   - **Activity Tracking**: Automatic monitoring of user activity
   - **Inactivity Detection**: Tracks time since last activity
   - **Nominee Claims**: Beneficiaries can claim their designated shares after inactivity period

### 🤝 Enhanced Borrow Request Flow

**Before**: Borrow requests appeared as simple chat messages.

**Now**:
- When you receive a borrow request, you see a **"View Request" button**
- Clicking it opens a detailed modal with:
  - Borrower information (ENS name, avatar, address)
  - Requested amount
  - Interest rate and duration
  - Total repayment calculation
  - Reason for borrowing
  - Two clear action buttons:
    - **✅ Accept & Fund**: Navigates to payment page with pre-filled loan details
    - **❌ Reject**: Declines the request and notifies the borrower

### 💳 Active Loan Management Modal

**Before**: Single "Repay" button in chat header.

**Now**: Clicking the repay button opens a comprehensive modal with multiple options:

#### For Borrowers:
1. **💰 Repay Now**
   - Full loan repayment
   - Navigates to payment page with total amount

2. **📊 Pay Installment**
   - Partial payment option
   - Enter custom amount
   - Remaining balance calculated automatically
   - Payment history tracked

3. **⏰ Request Extension**
   - Request additional days
   - Provide optional reason
   - Sends extension request to lender
   - Tracked in Firebase

#### Loan Details Displayed:
- Original loan amount
- Interest rate
- Total repayment amount
- Remaining balance
- Paid installments (if any)
- Due date with days remaining
- **Overdue status** with visual indicators

### 📊 Repayment Options

#### Full Repayment
Navigate to payment page with complete loan details pre-filled.

#### Installment Payments
- Pay any amount (up to remaining balance)
- All installments tracked in Firebase
- Remaining balance updated after each payment
- Payment history visible in loan modal

#### Extension Requests
- Request X additional days
- Provide optional reason
- Lender receives notification in chat
- Status tracked: pending → approved/rejected

### 🔔 Activity Tracking (Coming Soon)

The NomineeVault contract includes activity tracking features:
- `pingActivity()`: Called when user interacts with dapp
- `lastActivity()`: Returns timestamp of last activity
- `isUserInactive()`: Checks if user is inactive
- `timeUntilInactive()`: Shows countdown to inactivity
- `inactivityPeriod()`: Configurable threshold (default: 6 months)

**Planned Integration**:
- Auto-ping on wallet connection
- Activity indicator in navbar
- Status updates on deposit/withdraw/pay
- Visual countdown for approaching inactivity

### 🎨 UI Components

#### BorrowRequestModal
- **Location**: `dapp/src/components/BorrowRequestModal.jsx`
- **Purpose**: Display and handle borrow request acceptance/rejection
- **Features**:
  - ENS name and avatar integration
  - Interest and repayment calculations
  - Accept → Payment page navigation
  - Reject → Firebase status update + notification

#### ActiveLoanModal
- **Location**: `dapp/src/components/ActiveLoanModal.jsx`
- **Purpose**: Comprehensive loan management interface
- **Features**:
  - Three action options (Repay/Installment/Extension)
  - Loan status badge (Active/Overdue)
  - Payment history display
  - Installment amount input
  - Extension request form

### 🗄️ Firebase Schema Updates

#### New Fields in `borrows/{address}/{borrowId}`:
```javascript
{
  // Existing fields...
  requestStatus: 'pending' | 'accepted' | 'rejected',
  installmentPlan: [
    {
      amount: '0.5',
      timestamp: 1234567890,
      txHash: '0x...'
    }
  ],
  paidInstallments: [
    {
      amount: '0.3',
      paidAt: 1234567890,
      txHash: '0x...'
    }
  ],
  remainingAmount: '0.7',
  extensionRequests: [
    {
      requestedDays: 7,
      reason: 'Need more time',
      status: 'pending',
      createdAt: 1234567890
    }
  ]
}
```

#### New Collection: `extensionRequests`
```javascript
{
  loanId: 'loan-123',
  borrower: '0x...',
  lender: '0x...',
  currentDueDate: 1234567890,
  requestedDays: 7,
  reason: 'Optional reason',
  status: 'pending' | 'approved' | 'rejected',
  createdAt: 1234567890
}
```

### 🔐 Security

All Firebase credentials are now stored in environment variables:
- `.env` file (gitignored)
- `.env.example` template for new developers
- No credentials exposed in repository

### 🎯 How to Use

#### As a Lender:
1. Receive borrow request in chat
2. Click **"View Request"** button
3. Review borrower details and loan terms
4. Click **✅ Accept & Fund** or **❌ Reject**
5. If accepted, complete payment on payment page

#### As a Borrower:
1. Send borrow request via chat
2. Wait for lender acceptance
3. Once funded, loan appears as active
4. Click **💳 Repay** button in chat header
5. Choose repayment option:
   - Full repayment
   - Partial installment
   - Request extension

### 🚀 Technical Details

**Contracts**:
- Network: Sepolia Testnet
- ChainVaultCore: `0x4Bb25877b98782B0c15CE79119c37a7ea84A986f`
- NomineeVault: `0x73C46FFa37fabb905689688Bd0138c02438413Cf`

**Configuration**:
- Contract address in `dapp/src/config.js`
- Currently set to NomineeVault (includes all ChainVaultCore features)
- Full ABI available with both contract sets of functions

**State Management**:
- React hooks for wallet connection
- Firebase Realtime Database for chat and loan data
- Wagmi for blockchain interactions
- ENS and EFP for identity resolution

### 📝 TODO / Roadmap

- [ ] Implement auto activity tracking on wallet connection
- [ ] Add activity status indicator in navbar
- [ ] Create extension approval flow for lenders
- [ ] Add notifications for extension requests
- [ ] Implement installment plan templates
- [ ] Add loan history page
- [ ] Create analytics dashboard for lending/borrowing activity
- [ ] Add nominee management UI
- [ ] Implement nominee claim process for inactive users
- [ ] Add multi-signature nominee approvals

### 🐛 Known Issues

None currently. Build successful with no errors.

### 📞 Support

For issues or questions:
- Check Firebase Console: https://console.firebase.google.com/project/chainvault-997c7
- View contracts on Sepolia Etherscan
- GitHub: https://github.com/ivocreates/chainvalut
