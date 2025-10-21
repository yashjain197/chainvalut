# ChainVault DApp

A secure, user-friendly decentralized application for managing ETH in a smart contract vault.

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
