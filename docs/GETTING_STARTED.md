# Getting Started with ChainVault

> **Quick start guide to set up and run ChainVault locally**

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Running the Application](#running-the-application)
5. [Project Structure](#project-structure)
6. [Development Tips](#development-tips)

---

## Prerequisites

Before you begin, ensure you have:

### Required Tools

**Node.js & npm**
```bash
node --version  # v18.0.0 or higher
npm --version   # v9.0.0 or higher
```
Download: [https://nodejs.org/](https://nodejs.org/)

**Git**
```bash
git --version  # v2.30.0 or higher
```
Download: [https://git-scm.com/](https://git-scm.com/)

**Web3 Wallet**
- MetaMask browser extension (recommended)
- Or any WalletConnect-compatible wallet

**Testnet ETH**
- Get free Sepolia testnet ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
- Minimum: 0.1 ETH for testing

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ivocreates/chainvalut.git
cd chainvalut/dapp
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- React 19.0.0
- Vite 7.1.10
- Wagmi 2.15.2
- Ethers.js 6.13.5
- RainbowKit 2.2.1
- Firebase 11.2.0
- And all other dependencies

**Installation Time:** ~2-3 minutes (depending on internet speed)

---

## Configuration

### WalletConnect Setup

ChainVault uses WalletConnect v2 for wallet connections.

**Get Your Project ID:**

1. **Visit WalletConnect Cloud**
   ```
   https://cloud.walletconnect.com/
   ```

2. **Create Account**
   - Sign up for free
   - Verify email

3. **Create New Project**
   - Click "Create New Project"
   - Name: "ChainVault"
   - Description: "P2P Lending Platform"
   - Project Type: "App"

4. **Copy Project ID**
   ```
   Example: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```

5. **Add to Configuration**
   
   Open `dapp/src/config/wagmi.js`:
   ```javascript
   export const projectId = 'YOUR_PROJECT_ID_HERE';
   ```
   
   Replace `YOUR_PROJECT_ID_HERE` with your actual project ID.

---

### Environment Variables (Optional)

Create `.env` file in `dapp/` directory:

```env
# WalletConnect (required)
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Firebase (already configured, optional to override)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com

# Contract Address (already configured)
VITE_CONTRACT_ADDRESS=0xE6f6139929D658d31c5301F02bD8F5cE0b12Ffa4
```

**Note:** The app will work with default configuration. Environment variables are only needed if you want to use your own Firebase instance.

---

## Running the Application

### Development Server

```bash
npm run dev
```

**Expected Output:**
```
  VITE v7.1.10  ready in 1264 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Access the App:**
- Open browser: `http://localhost:5173/`
- Hot reload enabled (changes reflect immediately)

---

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

**Build Output:**
```
dist/
├── index.html
├── assets/
│   ├── index-abc123.js
│   ├── index-abc123.css
│   └── ...
└── ...
```

**Deploy `dist/` folder** to:
- Firebase Hosting
- Vercel
- Netlify
- GitHub Pages

---

## Project Structure

```
dapp/
├── public/              # Static assets
│   └── vite.svg
├── src/
│   ├── components/      # React components
│   │   ├── ActionPanel.jsx        # Deposit/Withdraw/Pay
│   │   ├── BalanceCard.jsx        # Balance display
│   │   ├── Chat.jsx               # P2P messaging
│   │   ├── LendingMarketplace.jsx # Loan marketplace
│   │   ├── Payroll.jsx            # Multi-payment system
│   │   └── ...
│   ├── config/          # Configuration files
│   │   ├── firebase.js            # Firebase setup
│   │   └── wagmi.js               # Web3 config
│   ├── hooks/           # Custom React hooks
│   │   ├── useEnhancedWeb3.js    # Web3 connection
│   │   ├── useENS.js             # ENS resolution
│   │   └── useLit.js             # Lit Protocol
│   ├── styles/          # CSS files
│   │   ├── ActionPanel.css
│   │   ├── Payroll.css
│   │   └── ...
│   ├── utils/           # Utility functions
│   │   ├── blockscout.js         # Explorer API
│   │   └── etherscan.js          # Etherscan API
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── config.js        # Contract config
├── index.html           # HTML template
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
└── eslint.config.js     # ESLint rules
```

---

## Development Tips

### Hot Reload

Vite provides instant hot module replacement:
- Save file → Changes appear immediately
- Preserves component state
- Shows errors in browser overlay

---

### Component Development

**Example: Creating a New Component**

1. **Create Component File**
   ```javascript
   // src/components/MyComponent.jsx
   import React, { useState } from 'react';
   import './MyComponent.css';

   export const MyComponent = ({ prop1, prop2 }) => {
     const [state, setState] = useState('');

     return (
       <div className="my-component">
         <h2>My Component</h2>
         {/* component content */}
       </div>
     );
   };
   ```

2. **Create Styles**
   ```css
   /* src/styles/MyComponent.css */
   .my-component {
     padding: 20px;
     background: #1a1a1a;
     border-radius: 12px;
   }
   ```

3. **Import in App**
   ```javascript
   // src/App.jsx
   import { MyComponent } from './components/MyComponent';

   function App() {
     return (
       <div className="app">
         <MyComponent prop1="value" />
       </div>
     );
   }
   ```

---

### Web3 Integration

**Using the useEnhancedWeb3 Hook:**

```javascript
import { useEnhancedWeb3 } from './hooks/useEnhancedWeb3';

function MyComponent() {
  const {
    address,
    isConnected,
    contract,
    balance,
    ethBalance
  } = useEnhancedWeb3();

  const handleDeposit = async () => {
    if (!contract) {
      alert('Please connect wallet');
      return;
    }

    const ref = ethers.hexlify(ethers.randomBytes(32));
    const tx = await contract.deposit(ref, {
      value: ethers.parseEther('1.0')
    });
    await tx.wait();
  };

  return (
    <div>
      {isConnected ? (
        <>
          <p>Address: {address}</p>
          <p>Vault: {balance} ETH</p>
          <p>Wallet: {ethBalance} ETH</p>
          <button onClick={handleDeposit}>Deposit</button>
        </>
      ) : (
        <p>Please connect wallet</p>
      )}
    </div>
  );
}
```

---

### Debugging

**Browser Console:**
```javascript
// Add debug logs
console.log('Transaction hash:', tx.hash);
console.log('Receipt:', receipt);
```

**React DevTools:**
- Install React DevTools browser extension
- Inspect component state and props
- Profile performance

**Vite Inspector:**
```bash
# In terminal while dev server running
# Type 'o' to open in editor
# Type 'r' to restart server
# Type 'u' to show server url
```

---

### Testing Transactions

**Using Sepolia Testnet:**

1. **Get Test ETH**
   ```
   https://sepoliafaucet.com/
   ```

2. **Switch Network in MetaMask**
   - Network: Sepolia
   - Chain ID: 11155111
   - RPC: Auto (or use Alchemy/Infura)

3. **Test Transaction Flow**
   ```
   Deposit → Wait for confirmation → Check balance
   Withdraw → Verify wallet balance increased
   Pay → Verify recipient received funds
   ```

4. **View on Explorer**
   ```
   https://eth-sepolia.blockscout.com/
   ```

---

### Common Issues

**Issue:** Port 5173 already in use
```bash
# Vite will automatically try 5174, 5175, etc.
# Or kill the process:
npx kill-port 5173
```

**Issue:** Module not found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue:** MetaMask not connecting
```bash
# Clear site data in browser
# Refresh page
# Try connecting again
```

**Issue:** Contract call fails
```javascript
// Check if wallet is connected
if (!address) {
  alert('Connect wallet first');
  return;
}

// Check if on correct network
const chainId = await publicClient.getChainId();
if (chainId !== 11155111) {
  alert('Please switch to Sepolia network');
  return;
}
```

---

## Contract Address

**ChainVault Core (Sepolia):**
```
0xE6f6139929D658d31c5301F02bD8F5cE0b12Ffa4
```

**View on Blockscout:**
```
https://eth-sepolia.blockscout.com/address/
0xE6f6139929D658d31c5301F02bD8F5cE0b12Ffa4
```

**Contract ABI:**
Located at: `contracts/abi/ChainVaultCore.json`

---

## Technology Stack

### Frontend
- **React 19.0** - UI framework
- **Vite 7.1** - Build tool & dev server
- **Wagmi 2.15** - React hooks for Ethereum
- **Ethers.js 6.13** - Ethereum library
- **RainbowKit 2.2** - Wallet connection UI

### Web3
- **WalletConnect** - Multi-wallet support
- **Chainlink** - Price feeds
- **Lit Protocol** - Encryption

### Backend
- **Firebase Realtime Database** - Real-time data
- **Firebase Hosting** - Static hosting
- **Smart Contracts** - Solidity ^0.8.19

---

## Mobile Support

ChainVault is fully responsive:

**Breakpoints:**
```css
/* Mobile phones */
@media (max-width: 768px) { }

/* Tablets */
@media (min-width: 769px) and (max-width: 1024px) { }

/* Desktop */
@media (min-width: 1025px) { }
```

**Mobile Wallet Connection:**
1. Open ChainVault on mobile browser
2. Click "Connect Wallet"
3. Select WalletConnect
4. Open wallet app (MetaMask, Rainbow, etc.)
5. Scan QR code or use automatic connection

---

## Color Palette

```css
/* Main Colors */
--background: #0B0E11;
--surface: #1A1A1A;
--primary: #1A73E8;
--success: #4CAF50;
--error: #FF6B6B;
--warning: #FFA726;

/* Text */
--text-primary: #FFFFFF;
--text-secondary: #B0B0B0;
--text-muted: #666666;

/* Borders */
--border: #2A2A2A;
--border-hover: #3A3A3A;
```

---

## Next Steps

After getting the app running:

1. **Explore Features**
   - Connect your wallet
   - Deposit some test ETH
   - Try lending and borrowing
   - Send payments to test addresses

2. **Read Documentation**
   - [User Guide](./USER_GUIDE.md) - How to use features
   - [Technical Documentation](./TECHNICAL_DOCUMENTATION.md) - Architecture details
   - [Development Attribution](./DEVELOPMENT_ATTRIBUTION.md) - Project credits

3. **Join Development**
   - Report bugs on GitHub
   - Suggest features
   - Submit pull requests
   - Review code changes

---

## Support

**Issues?** [Create GitHub Issue](https://github.com/ivocreates/chainvalut/issues)

**Questions?** Check the [User Guide](./USER_GUIDE.md) or [Technical Documentation](./TECHNICAL_DOCUMENTATION.md)

---

*Last Updated: October 26, 2025*
*Version: 2.0.0*

**Happy coding! 🚀**
