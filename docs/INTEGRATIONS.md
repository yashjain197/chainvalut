# ChainVault Integrations Guide

> Complete guide for all third-party services and blockchain integrations

---

## Table of Contents

1. [WalletConnect Setup](#walletconnect-setup)
2. [Firebase Configuration](#firebase-configuration)
3. [Blockscout Explorer](#blockscout-explorer)
4. [Lit Protocol Encryption](#lit-protocol-encryption)
5. [Chainlink Price Feeds](#chainlink-price-feeds)
6. [Troubleshooting](#troubleshooting)

---

## WalletConnect Setup

### Overview

WalletConnect enables connection to 100+ mobile and desktop wallets through a single integration.

### Quick Setup (2 minutes)

**Step 1: Create WalletConnect Account**
1. Visit [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Sign in with GitHub, Google, or Email

**Step 2: Create New Project**
1. Click "Create New Project"
2. Project details:
   - **Name**: ChainVault
   - **Homepage**: `http://localhost:5173` (development)
   - **Description**: Decentralized Finance Management
3. Click "Create"

**Step 3: Get Project ID**
1. Copy your **Project ID** (32-character string)
2. Format: `abc123def456ghi789...`

**Step 4: Configure Application**

Update `src/config/wagmi.js`:

```javascript
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'ChainVault',
  projectId: 'YOUR_PROJECT_ID_HERE', // ← Replace this
  chains: [sepolia],
  ssr: false,
});
```

**Step 5: Verify Connection**
```bash
npm run dev
```

Visit `http://localhost:5173` and test wallet connection.

### Supported Wallets

**Desktop:**
- MetaMask
- Rainbow Wallet
- Coinbase Wallet
- Ledger Live
- Frame Wallet

**Mobile:**
- Trust Wallet
- Rainbow
- Argent
- Zerion
- imToken
- TokenPocket
- Math Wallet
- And 100+ more!

### Production Deployment

**Update WalletConnect Dashboard:**
1. Go to Project Settings
2. Update Homepage URL to production domain
3. Add domain to Allowed Origins:
   ```
   https://your-domain.com
   https://chainvault.web.app
   ```

**Environment Variables:**
```env
VITE_WALLETCONNECT_PROJECT_ID=your_actual_project_id
```

### Troubleshooting WalletConnect

**Issue: "Invalid Project ID"**
- Verify Project ID is exactly 32 characters
- Check for extra spaces or quotes
- Ensure Project ID is from WalletConnect Cloud (not ReownCloud)

**Issue: Connection Timeout**
- Check internet connection
- Try different wallet
- Clear browser cache
- Restart dev server

**Issue: Mobile Wallet Not Connecting**
- Ensure HTTPS in production
- For local testing, use desktop wallets or ngrok tunnel
- Check wallet app is updated

---

## Firebase Configuration

### Overview

Firebase Realtime Database provides real-time data synchronization for lending offers, chat, profiles, and payroll batches.

### Initial Setup

**1. Create Firebase Project**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Project name: `chainvault` (or your choice)
4. Enable/disable Google Analytics
5. Click "Create project"

**2. Enable Realtime Database**
1. Navigate to **Build** → **Realtime Database**
2. Click "Create Database"
3. Select location: `us-central1` (or closest to users)
4. Start in **Test mode** (for development)
5. Click "Enable"

**3. Copy Configuration**

Go to **Project Settings** → **General** → **Your apps** → **Web app**

```javascript
// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "chainvault-xxxxx.firebaseapp.com",
  databaseURL: "https://chainvault-xxxxx-default-rtdb.firebaseio.com",
  projectId: "chainvault-xxxxx",
  storageBucket: "chainvault-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:...",
  measurementId: "G-XXXXXXXXXX"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
```

### Database Security Rules

**Development Rules (Test Mode):**

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

**Production Rules (Recommended):**

```json
{
  "rules": {
    "lendingOffers": {
      ".read": true,
      "$offerId": {
        ".write": "auth != null"
      }
    },
    
    "borrows": {
      "$userAddress": {
        ".read": "auth != null",
        ".write": "$userAddress === auth.uid"
      }
    },
    
    "lenderLoans": {
      "$lenderAddress": {
        ".read": "auth != null",
        ".write": "$lenderAddress === auth.uid"
      }
    },
    
    "conversations": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    
    "messages": {
      "$conversationId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    
    "payrollBatches": {
      "$userAddress": {
        ".read": "$userAddress === auth.uid",
        ".write": "$userAddress === auth.uid"
      }
    },
    
    "profiles": {
      "$userAddress": {
        ".read": true,
        ".write": "$userAddress === auth.uid"
      }
    }
  }
}
```

**Deploy Rules:**
```bash
firebase deploy --only database
```

### Database Schema

```
/lendingOffers/{offerId}
  ├── lenderAddress: string
  ├── amount: number
  ├── interestRate: number
  ├── duration: number (days)
  ├── status: "active" | "filled" | "cancelled"
  ├── borrower: string (optional)
  └── createdAt: timestamp

/borrows/{borrowerAddress}/{loanId}
  ├── lenderAddress: string
  ├── amount: number
  ├── totalRepayment: number
  ├── borrowedAt: timestamp
  ├── dueDate: timestamp
  └── status: "active" | "completed" | "overdue"

/lenderLoans/{lenderAddress}/{loanId}
  ├── borrowerAddress: string
  ├── amount: number
  ├── totalRepayment: number
  └── dueDate: timestamp

/conversations/{conversationId}
  ├── participants: [address1, address2]
  ├── lastMessage: string
  ├── lastMessageTime: timestamp
  └── unreadCount: { address1: 0, address2: 0 }

/messages/{conversationId}/{messageId}
  ├── senderId: string
  ├── text: string
  ├── timestamp: timestamp
  └── read: boolean

/payrollBatches/{ownerAddress}/{batchId}
  ├── name: string
  ├── recipients: [{ wallet, amount, name }]
  ├── totalAmount: number
  ├── createdAt: timestamp
  └── lastModified: timestamp

/profiles/{walletAddress}
  ├── displayName: string
  ├── bio: string
  ├── avatar: string (URL)
  ├── email: string
  ├── twitter: string
  ├── github: string
  ├── telegram: string
  ├── discord: string
  └── updatedAt: timestamp
```

### Usage Examples

**Create Lending Offer:**
```javascript
import { ref, push, set } from 'firebase/database';
import { database } from '../config/firebase';

const createOffer = async (offer) => {
  const offersRef = ref(database, 'lendingOffers');
  const newOfferRef = push(offersRef);
  
  await set(newOfferRef, {
    lenderAddress: offer.lenderAddress,
    amount: offer.amount,
    interestRate: offer.interestRate,
    duration: offer.duration,
    status: 'active',
    createdAt: Date.now()
  });
  
  return newOfferRef.key;
};
```

**Listen to Real-Time Updates:**
```javascript
import { ref, onValue } from 'firebase/database';

const offersRef = ref(database, 'lendingOffers');
onValue(offersRef, (snapshot) => {
  const offers = [];
  snapshot.forEach((child) => {
    offers.push({ id: child.key, ...child.val() });
  });
  setOffers(offers);
});
```

### Troubleshooting Firebase

**Issue: "Permission Denied"**
- Check database rules are deployed
- Verify database URL includes `-default-rtdb`
- Ensure `.read` and `.write` permissions are set

**Issue: "Cannot read properties of undefined"**
- Verify Firebase is initialized before use
- Check `firebase.js` is imported correctly
- Ensure database reference is correct

**Issue: Data Not Syncing**
- Check internet connection
- Verify Firebase console shows updates
- Clear browser cache
- Check for JavaScript errors in console

---

## Blockscout Explorer

### Overview

Blockscout provides open-source blockchain explorer functionality with comprehensive transaction and address information.

### Features

**Transaction Explorer:**
- View transaction details
- Transaction status (success/failed/pending)
- Gas usage and fees
- Block confirmations
- Method calls

**Address Information:**
- Balance tracking
- Transaction history
- Token transfers
- Contract interactions

**Supported Networks:**
- Ethereum Mainnet
- Sepolia Testnet
- Optimism
- Arbitrum
- Polygon
- Base
- BSC

### Implementation

**Blockscout Utility (`utils/blockscout.js`):**

```javascript
const BLOCKSCOUT_ENDPOINTS = {
  1: 'https://eth.blockscout.com/api/v2',
  11155111: 'https://eth-sepolia.blockscout.com/api/v2',
  10: 'https://optimism.blockscout.com/api/v2',
  42161: 'https://arbitrum.blockscout.com/api/v2',
  137: 'https://polygon.blockscout.com/api/v2',
  8453: 'https://base.blockscout.com/api/v2',
  56: 'https://bsc.blockscout.com/api/v2',
};

export const getTransactionDetails = async (txHash, chainId = 11155111) => {
  const endpoint = BLOCKSCOUT_ENDPOINTS[chainId];
  const response = await fetch(`${endpoint}/transactions/${txHash}`);
  const data = await response.json();
  
  return {
    success: true,
    data,
    explorerUrl: buildExplorerLink('tx', txHash, chainId)
  };
};

export const buildExplorerLink = (type, value, chainId = 11155111) => {
  const baseUrls = {
    1: 'https://eth.blockscout.com',
    11155111: 'https://eth-sepolia.blockscout.com',
    // ... other networks
  };
  
  return `${baseUrls[chainId]}/${type}/${value}`;
};
```

### Components

**Transaction Details Modal:**

```javascript
import TransactionDetailsModal from './components/TransactionDetailsModal';

function PaymentSuccess({ txHash }) {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowModal(true)}>
        View Transaction Details
      </button>
      
      {showModal && (
        <TransactionDetailsModal
          txHash={txHash}
          chainId={11155111}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
```

**Blockscout Widget:**

```javascript
import BlockscoutWidget from './components/BlockscoutWidget';

function Dashboard() {
  return (
    <div>
      <h2>Recent Activity</h2>
      <BlockscoutWidget address={userAddress} chainId={11155111} />
    </div>
  );
}
```

### API Endpoints

**Get Transaction:**
```
GET https://eth-sepolia.blockscout.com/api/v2/transactions/{hash}
```

**Get Address Transactions:**
```
GET https://eth-sepolia.blockscout.com/api/v2/addresses/{address}/transactions
```

**Get Address Details:**
```
GET https://eth-sepolia.blockscout.com/api/v2/addresses/{address}
```

### Usage Examples

**Check Transaction Status:**
```javascript
import { getTransactionDetails } from '../utils/blockscout';

const checkTransaction = async (txHash) => {
  const result = await getTransactionDetails(txHash, 11155111);
  
  if (result.success) {
    console.log('Status:', result.data.status);
    console.log('Block:', result.data.block);
    console.log('Gas Used:', result.data.gas_used);
    console.log('View on Blockscout:', result.explorerUrl);
  }
};
```

**Get Address History:**
```javascript
import { getAddressTransactions } from '../utils/blockscout';

const loadHistory = async (address) => {
  const result = await getAddressTransactions(address, 11155111);
  
  if (result.success) {
    result.data.items.forEach(tx => {
      console.log(`${tx.method} - ${tx.value} ETH`);
    });
  }
};
```

---

## Lit Protocol Encryption

### Overview

Lit Protocol provides decentralized encryption with programmable access control based on on-chain conditions.

### Features

**Encryption Types:**
- Owner-only encryption
- Two-party encryption (e.g., lender + borrower)
- Token-gated encryption
- Time-locked encryption
- Multi-condition encryption

**Use Cases in ChainVault:**
1. Private lending terms
2. Encrypted chat messages
3. Secure payroll data
4. Confidential loan agreements
5. Sensitive recipient information

### Setup

**Install Dependencies:**
```bash
npm install @lit-protocol/lit-node-client
```

**Initialize Lit Client (`utils/lit.js`):**

```javascript
import * as LitJsSdk from '@lit-protocol/lit-node-client';

let litNodeClient = null;

export const initializeLit = async () => {
  if (litNodeClient) return litNodeClient;
  
  litNodeClient = new LitJsSdk.LitNodeClient({
    litNetwork: 'datil-test',
    debug: false,
  });
  
  await litNodeClient.connect();
  return litNodeClient;
};
```

### Access Control Patterns

**1. Owner-Only Access:**
```javascript
export const createAccessControlConditions = (address) => [
  {
    contractAddress: '',
    standardContractType: '',
    chain: 'sepolia',
    method: '',
    parameters: [':userAddress'],
    returnValueTest: {
      comparator: '=',
      value: address.toLowerCase(),
    },
  },
];
```

**2. Two-Party Access:**
```javascript
export const createMultiPartyAccessControl = (address1, address2) => [
  {
    contractAddress: '',
    standardContractType: '',
    chain: 'sepolia',
    method: '',
    parameters: [':userAddress'],
    returnValueTest: {
      comparator: '=',
      value: address1.toLowerCase(),
    },
  },
  { operator: 'or' },
  {
    contractAddress: '',
    standardContractType: '',
    chain: 'sepolia',
    method: '',
    parameters: [':userAddress'],
    returnValueTest: {
      comparator: '=',
      value: address2.toLowerCase(),
    },
  },
];
```

**3. Token Balance Requirement:**
```javascript
export const createTokenBalanceAccessControl = (
  tokenAddress,
  minBalance
) => [
  {
    contractAddress: tokenAddress,
    standardContractType: 'ERC20',
    chain: 'sepolia',
    method: 'balanceOf',
    parameters: [':userAddress'],
    returnValueTest: {
      comparator: '>=',
      value: minBalance,
    },
  },
];
```

**4. Time-Locked Access:**
```javascript
export const createTimeLockedAccessControl = (address, unlockTimestamp) => [
  {
    contractAddress: '',
    standardContractType: '',
    chain: 'sepolia',
    method: '',
    parameters: [':userAddress'],
    returnValueTest: {
      comparator: '=',
      value: address.toLowerCase(),
    },
  },
  { operator: 'and' },
  {
    contractAddress: '',
    standardContractType: 'timestamp',
    chain: 'sepolia',
    method: '',
    parameters: [],
    returnValueTest: {
      comparator: '>=',
      value: unlockTimestamp.toString(),
    },
  },
];
```

### Encryption Functions

**Encrypt String:**
```javascript
export const encryptString = async (
  text,
  accessControlConditions,
  chain = 'sepolia'
) => {
  const client = await initializeLit();
  
  const { ciphertext, dataToEncryptHash } = await LitJsSdk.encryptString(
    {
      accessControlConditions,
      chain,
      dataToEncrypt: text,
    },
    client
  );
  
  return {
    ciphertext,
    dataToEncryptHash,
    accessControlConditions,
    chain,
  };
};
```

**Decrypt String:**
```javascript
export const decryptString = async (encryptedData, chain = 'sepolia') => {
  const client = await initializeLit();
  
  const decryptedString = await LitJsSdk.decryptToString(
    {
      accessControlConditions: encryptedData.accessControlConditions,
      chain,
      ciphertext: encryptedData.ciphertext,
      dataToEncryptHash: encryptedData.dataToEncryptHash,
    },
    client
  );
  
  return decryptedString;
};
```

### React Hook

**useLit Hook (`hooks/useLit.js`):**

```javascript
import { useLit } from '../hooks/useLit';

function MyComponent() {
  const {
    isInitialized,
    isInitializing,
    error,
    encryptForSelf,
    encryptForTwo,
    decrypt
  } = useLit();

  const handleEncrypt = async () => {
    const encrypted = await encryptForSelf("secret message");
    console.log('Encrypted:', encrypted);
  };

  const handleDecrypt = async (encryptedData) => {
    const decrypted = await decrypt(encryptedData);
    console.log('Decrypted:', decrypted);
  };

  return (
    <div>
      {isInitializing && <p>Initializing Lit Protocol...</p>}
      {error && <p>Error: {error}</p>}
      {isInitialized && (
        <>
          <button onClick={handleEncrypt}>Encrypt</button>
          <button onClick={handleDecrypt}>Decrypt</button>
        </>
      )}
    </div>
  );
}
```

### Usage Examples

**Example 1: Encrypt Lending Terms**
```javascript
import { encryptLendingTerms } from '../utils/lit';

const terms = {
  amount: '1.5',
  interestRate: 5,
  duration: 30,
  collateral: 'NFT #1234',
  privateNotes: 'Flexible on dates'
};

const encrypted = await encryptLendingTerms(
  terms,
  lenderAddress,
  borrowerAddress
);

// Store in Firebase
await set(ref(database, `loans/${loanId}/terms`), encrypted);
```

**Example 2: Encrypt Chat Message**
```javascript
import { encryptChatMessage } from '../utils/lit';

const message = "Private loan discussion...";
const encrypted = await encryptChatMessage(
  message,
  senderAddress,
  recipientAddress
);

await push(ref(database, `messages/${chatId}`), {
  ...encrypted,
  sender: senderAddress,
  timestamp: Date.now()
});
```

**Example 3: Decrypt Data**
```javascript
import { decryptLendingTerms } from '../utils/lit';

const snapshot = await get(ref(database, `loans/${loanId}/terms`));
const encryptedTerms = snapshot.val();

if (encryptedTerms.encrypted) {
  const decrypted = await decryptLendingTerms(encryptedTerms);
  console.log('Loan terms:', decrypted);
}
```

### Performance

- **Encryption**: ~2-3 seconds
- **Decryption**: ~1-2 seconds (requires wallet signature)
- **Initialization**: ~3-5 seconds (first time only)
- **Network**: Minimal latency on Datil Test

### Troubleshooting Lit Protocol

**Issue: "Failed to initialize"**
- Check internet connection
- Verify Lit network is accessible
- Try refreshing the page

**Issue: "Decryption failed"**
- Ensure you have access rights
- Confirm wallet is connected
- Check access control conditions are correct

**Issue: "Wallet signature required"**
- User must approve signature in wallet
- Each decrypt operation requires signature
- This is a security feature

---

## Chainlink Price Feeds

### Overview

Chainlink provides decentralized price oracles for real-time ETH/USD conversion and value display.

### Smart Contract Integration

```solidity
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract ChainVaultCore {
    AggregatorV3Interface internal priceFeed;
    
    constructor(address _priceFeed) {
        priceFeed = AggregatorV3Interface(_priceFeed);
    }
    
    function getUSDValue(uint256 ethAmount) public view returns (uint256) {
        (, int256 price, , ,) = priceFeed.latestRoundData();
        uint256 ethPriceInUSD = uint256(price);
        return (ethAmount * ethPriceInUSD) / 1e18;
    }
}
```

### Price Feed Addresses

**Sepolia Testnet:**
```
ETH/USD: 0x694AA1769357215DE4FAC081bf1f309aDC325306
```

**Ethereum Mainnet:**
```
ETH/USD: 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
```

### Frontend Integration

```javascript
import { ethers } from 'ethers';

const PRICE_FEED_ADDRESS = '0x694AA1769357215DE4FAC081bf1f309aDC325306';

const getETHPrice = async () => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const priceFeed = new ethers.Contract(
    PRICE_FEED_ADDRESS,
    ['function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)'],
    provider
  );
  
  const [, price] = await priceFeed.latestRoundData();
  const ethPrice = Number(price) / 1e8; // Chainlink uses 8 decimals
  
  return ethPrice;
};

// Usage
const ethPrice = await getETHPrice();
const usdValue = ethAmount * ethPrice;
```

---

## Troubleshooting

### Common Issues

**MetaMask Connection Failed:**
1. Check MetaMask is installed
2. Verify network is Sepolia
3. Ensure account is unlocked
4. Try reconnecting wallet

**Transaction Rejected:**
1. User cancelled in MetaMask
2. Insufficient funds
3. Gas estimation failed
4. Contract error (check console)

**Firebase Permission Denied:**
1. Deploy database rules
2. Verify authentication
3. Check user owns resource
4. Enable test mode for debugging

**Lit Protocol Initialization Error:**
1. Check internet connection
2. Verify Lit network status
3. Refresh page and retry
4. Check browser console for details

**Blockscout API Timeout:**
1. Network congestion
2. Try again in a few seconds
3. Verify transaction hash is correct
4. Check chainId matches network

### Debug Mode

**Enable Debug Logging:**
```javascript
// wagmi.js
export const config = getDefaultConfig({
  appName: 'ChainVault',
  projectId: 'YOUR_PROJECT_ID',
  chains: [sepolia],
  ssr: false,
  debug: true, // ← Enable debug mode
});

// lit.js
const litNodeClient = new LitJsSdk.LitNodeClient({
  litNetwork: 'datil-test',
  debug: true, // ← Enable debug mode
});
```

### Support Resources

**Documentation:**
- WalletConnect: https://docs.walletconnect.com/
- Firebase: https://firebase.google.com/docs
- Blockscout: https://docs.blockscout.com/
- Lit Protocol: https://developer.litprotocol.com/
- Chainlink: https://docs.chain.link/

**Community:**
- GitHub Issues: [chainvalut/issues](https://github.com/yashjain197/chainvalut/issues)
- Discord: (coming soon)
- Telegram: (coming soon)

---

*Last Updated: October 26, 2025*
