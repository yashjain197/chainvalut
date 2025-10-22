# ChainVault DApp

A modern, secure, and user-friendly decentralized application for managing ETH on the Sepolia testnet.

## ✨ Features

- 🔐 **Enhanced Wallet Connection** - RainbowKit integration supporting multiple wallet providers (MetaMask, WalletConnect, Coinbase Wallet, etc.)
- 💰 **Balance Management** - Real-time ETH balance tracking with USD conversion via Chainlink oracles
- 🔄 **Smart Transactions** - Deposit, withdraw, and send payments directly from your vault
- 📊 **Transaction History** - Monitor all your vault activities in real-time
- 📱 **Mobile Responsive** - Fully optimized UI/UX for all screen sizes
- 🎨 **Modern Design** - Clean interface with custom color palette and smooth animations

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MetaMask or compatible Web3 wallet
- Sepolia testnet ETH ([Get from faucet](https://sepoliafaucet.com/))

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## 🔧 Configuration

### WalletConnect Project ID

To enable WalletConnect and other wallet providers:

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Create a new project
3. Copy your Project ID
4. Update `src/config/wagmi.js`:

```javascript
export const config = getDefaultConfig({
  appName: 'ChainVault',
  projectId: 'YOUR_PROJECT_ID_HERE', // Replace with your Project ID
  chains: [sepolia],
  ssr: false,
});
```

### Contract Address

The ChainVault contract is deployed on Sepolia testnet at:
```
0x4Bb25877b98782B0c15CE79119c37a7ea84A986f
```

You can update this in `src/config.js` if deploying to a different address.

## 🎨 Tech Stack

- **React 19** - Modern React with hooks
- **Vite 7** - Lightning-fast build tool and dev server
- **RainbowKit** - Enhanced wallet connection UI with multi-wallet support
- **Wagmi** - React hooks for Ethereum interactions
- **Viem** - TypeScript-first Ethereum library
- **ethers.js 6** - Smart contract interactions
- **Chainlink** - Decentralized price feed oracles for ETH/USD

## 📱 Mobile Support

The dApp is fully responsive and optimized for all devices:

- 📱 **Mobile phones** (320px+) - Touch-friendly interface
- 📲 **Tablets** (768px+) - Optimized layouts
- 💻 **Desktop** (1024px+) - Full feature experience

Mobile-specific features:
- Touch-optimized buttons and interactions
- Adaptive layouts for small screens
- Optimized performance for mobile networks
- Native wallet app integration via WalletConnect

## Usage

### Connect Wallet
Click the "Connect Wallet" button to choose from multiple wallet providers including MetaMask, WalletConnect, Coinbase Wallet, and more.

### Deposit ETH
1. Navigate to the "Deposit" tab
2. Enter the amount of ETH to deposit
3. Click "Deposit ETH"
4. Confirm the transaction in your wallet

### Withdraw ETH
1. Navigate to the "Withdraw" tab
2. Enter amount and recipient address
3. Click "Withdraw" or "Withdraw All"
4. Confirm the transaction

### Send Payment
1. Navigate to the "Pay" tab
2. Enter recipient address and amount
3. Click "Send Payment"
4. Confirm in your wallet

## 🛠️ Available Scripts

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint and format code
npm run lint
```

## Color Palette

Custom color scheme for optimal Web3 UX:

- **Background**: `#0B0E11` - Deep charcoal
- **Primary Accent**: `#1A73E8` - Trust blue
- **Secondary Accent**: `#00E0FF` - Neon cyan  
- **Highlight**: `#4FC3F7` - Friendly blue
- **Text Primary**: `#E8EAED` - Clean off-white
- **Text Secondary**: `#9AA0A6` - Muted gray
- **Success**: `#00C853` - Safe green

## 🔒 Security

- Smart contract-based vault system
- Non-custodial - you control your funds
- Direct wallet-to-contract interactions
- Open source and auditable
- Testnet deployment for safe testing

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ for the Ethereum community

## Features

- 🔐 **Secure Vault**: Store your ETH securely in a smart contract
- 💰 **Deposit & Withdraw**: Easy deposit and withdrawal operations
- 💸 **Internal Payments**: Send ETH directly to other vault users
- 📊 **Real-time Price**: Live ETH/USD price feeds via Chainlink
- 📜 **Transaction History**: View your recent vault transactions
- 🎨 **Modern UI**: Sleek, Web3-optimized interface

## Smart Contract

- **Address**: `0x4Bb25877b98782B0c15CE79119c37a7ea84A986f`
- **Network**: Ethereum (verify the network in your MetaMask)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [MetaMask](https://metamask.io/) browser extension

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to the local URL shown in the terminal (usually `http://localhost:5173`)

4. Connect your MetaMask wallet

## Usage

### Connect Wallet
Click the "Connect Wallet" button in the header to connect your MetaMask wallet.

### Deposit ETH
1. Go to the "Deposit" tab
2. Enter the amount of ETH you want to deposit
3. Click "Deposit ETH"
4. Confirm the transaction in MetaMask

### Withdraw ETH
1. Go to the "Withdraw" tab
2. Enter the amount and recipient address
3. Click "Withdraw" or "Withdraw All"
4. Confirm the transaction in MetaMask

### Send Payment
1. Go to the "Pay" tab
2. Enter the recipient's address and amount
3. Click "Send Payment"
4. Confirm the transaction in MetaMask

## Color Palette

The app uses a carefully designed color scheme for optimal UX:

- **Background**: `#0B0E11` - Deep charcoal black
- **Primary Accent**: `#1A73E8` - Trust blue
- **Secondary Accent**: `#00E0FF` - Neon cyan
- **Highlight**: `#4FC3F7` - Friendly blue
- **Text Primary**: `#E8EAED` - Clean off-white
- **Text Secondary**: `#9AA0A6` - Muted gray
- **Success**: `#00C853` - Safe transactions green

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Technologies

- **React** - UI framework
- **Vite** - Build tool
- **ethers.js** - Ethereum library
- **MetaMask** - Web3 wallet

## License

MIT
