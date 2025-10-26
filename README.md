# ChainVault - Decentralized P2P Lending Platform

![ChainVault](https://img.shields.io/badge/Version-2.0-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![Ethereum](https://img.shields.io/badge/Network-Ethereum-purple)

ChainVault is a secure, decentralized peer-to-peer lending platform built on Ethereum that enables users to lend and borrow ETH with complete control, transparency, and privacy.

## 🌟 Features

### Core Functionality
- **🏦 Secure Vault System** - Smart contract-based vault for depositing and managing ETH with industry-leading security
- **💸 P2P Lending Marketplace** - Direct lending and borrowing between users with customizable terms
- **💬 Real-Time Chat** - Live messaging between lenders and borrowers to negotiate loan terms
- **🔒 Lit Protocol Integration** - Decentralized encryption for private lending terms and sensitive data
- **🔍 Blockscout Explorer** - Integrated blockchain explorer for transaction transparency

### Advanced Features
- **💰 Automated Payroll System** - Schedule recurring payments with signature-based authorization
  - Multiple payment frequencies (daily, weekly, monthly, custom intervals)
  - One-time signature approval for automated execution
  - Multi-recipient support
  - Real-time status tracking
  
- **👥 Nominee Management** - Designate trusted representatives to manage your account
  - Add/remove nominees
  - Set spending limits and permissions
  - Activity tracking and audit logs

- **📊 Comprehensive Dashboard**
  - Real-time balance tracking
  - Transaction history with detailed views
  - Active loan monitoring
  - Lending statistics and analytics

### Security & Privacy
- **🔐 Encryption** - Lit Protocol integration for:
  - Private lending terms (lender + borrower only)
  - Encrypted payroll data
  - Secure chat messages
  - Token-gated and time-locked access controls

- **🛡️ Smart Contract Security**
  - Audited contract architecture
  - Role-based access control
  - Emergency pause functionality
  - Reentrancy protection

### User Experience
- **🌐 Multi-Network Support** - Ethereum, Sepolia, Optimism, Arbitrum, Polygon, Base, BSC
- **👤 ENS Integration** - Display ENS names and avatars
- **📱 Responsive Design** - Mobile-friendly interface
- **🎨 Modern UI** - Dark theme with gradient accents
- **⚡ Real-Time Updates** - Instant balance and transaction updates

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ and npm
- MetaMask or compatible Web3 wallet
- Firebase account (for hosting)

### Installation

```bash
# Clone the repository
git clone https://github.com/ivocreates/chainvalut.git
cd chainvalut

# Install dapp dependencies
cd dapp
npm install

# Start development server
npm run dev
```

### Smart Contract Deployment

```bash
# Navigate to contracts directory
cd contracts

# Install Foundry dependencies
forge install

# Deploy to Sepolia testnet
forge script script/DeployChainVaultCore.s.sol --rpc-url sepolia --broadcast --verify
```

## 📖 Documentation

All detailed documentation is available in the `/docs` folder:

- **Setup & Configuration**
  - [Firebase Setup](./docs/FIREBASE_SETUP.md)
  - [WalletConnect Setup](./docs/WALLETCONNECT_SETUP.md)
  - [Firebase Rules Update](./docs/FIREBASE_RULES_UPDATE.md)

- **Feature Documentation**
  - [Complete Feature List](./docs/FEATURES.md)
  - [Lit Protocol Integration](./docs/LIT_PROTOCOL_INTEGRATION.md)
  - [Blockscout Integration](./docs/BLOCKSCOUT_INTEGRATION.md)
  - [Payroll & Nominee Features](./docs/PAYROLL_NOMINEE_FEATURES.md)

- **Development**
  - [Development Attribution](./docs/DEVELOPMENT_ATTRIBUTION.md)
  - [Roadmap](./docs/roadmap.md)
  - [Update History](./docs/FEATURE_UPDATE_COMPLETE.md)

## 🏗️ Architecture

### Frontend (dApp)
- **Framework**: React + Vite
- **Web3**: Wagmi v2 + Ethers v6
- **Styling**: Custom CSS with CSS Variables
- **Database**: Firebase Realtime Database
- **Encryption**: Lit Protocol SDK v7

### Smart Contracts
- **Framework**: Foundry (Forge, Cast, Anvil)
- **Language**: Solidity ^0.8.19
- **Dependencies**: OpenZeppelin Contracts, Chainlink Price Feeds
- **Network**: Ethereum Sepolia Testnet

### Key Technologies
- **ENS**: Ethereum Name Service for user profiles
- **Blockscout**: Blockchain explorer integration
- **WalletConnect**: Multi-wallet support
- **Firebase**: Real-time database and hosting

## 💻 Tech Stack

**Frontend:**
- React 19.0
- Vite 6.0
- Wagmi v2.15
- Ethers v6.13
- Lit Protocol v7
- Firebase SDK

**Smart Contracts:**
- Solidity ^0.8.19
- Foundry
- OpenZeppelin Contracts v5.2
- Chainlink Price Feeds

**Infrastructure:**
- Firebase (Database + Hosting)
- Ethereum Sepolia Testnet
- Lit Protocol DatilTest Network
- Blockscout Explorer API

## 🎯 Use Cases

1. **Personal Lending** - Lend ETH to friends/family with customized terms
2. **Business Payroll** - Automate salary payments to employees
3. **DeFi Integration** - Use as collateral or yield farming
4. **Secure Storage** - Store ETH with encryption and access controls
5. **DAO Treasury** - Manage organization funds with multi-sig nominees

## 🔗 Networks

ChainVault supports the following networks:

- **Ethereum Mainnet** (Chain ID: 1)
- **Sepolia Testnet** (Chain ID: 11155111) ⭐ Primary
- **Optimism** (Chain ID: 10)
- **Arbitrum** (Chain ID: 42161)
- **Polygon** (Chain ID: 137)
- **Base** (Chain ID: 8453)
- **BSC** (Chain ID: 56)

## 📝 Smart Contract

**ChainVaultCore.sol** - Main contract deployed on Sepolia:
- Address: `[Deployed Contract Address]`
- Explorer: [View on Blockscout](https://eth-sepolia.blockscout.com)

Key Functions:
- `deposit()` - Deposit ETH into vault
- `withdraw()` - Withdraw ETH from vault
- `pay()` - Send ETH to another user
- `requestLoan()` - Create a lending offer
- `fundLoan()` - Fund a borrower's request
- `repayLoan()` - Repay an active loan
- `addNominee()` - Add trusted representative
- `schedulePayroll()` - Create automated payment schedule

## 🛠️ Development

### Running Locally

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing Smart Contracts

```bash
cd contracts

# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test
forge test --match-test testDeposit
```

### Deployment

```bash
# Build dapp
cd dapp
npm run build

# Deploy to Firebase
firebase deploy
```

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👥 Credits

### Development Team

**UI/UX & Frontend Development**
- **Ivo Pereira** ([@ivocreates](https://github.com/ivocreates))
  - Complete UI/UX design and implementation
  - Frontend architecture and React components
  - CSS styling and responsive design
  - Feature integration and testing

**Smart Contract Development**
- **MD Imran** ([@mdimran29](https://github.com/mdimran29))
  - Core smart contract architecture
  - Solidity development and optimization
  
- **Yash Jain** ([@yashjain197](https://github.com/yashjain197))
  - Smart contract testing and deployment
  - Security auditing and optimization

### Development Approach

This project represents a hybrid development approach:
- **~70% Human-Written Code** - Core architecture, UI/UX, smart contracts, and critical business logic
- **~30% AI-Assisted** - Used for:
  - Complex integration research (Lit Protocol, Blockscout, WalletConnect)
  - Debugging and error resolution
  - Code optimization and refactoring
  - Documentation generation

**Tools Used:**
- ChatGPT - Technical research and complex problem solving
- GitHub Copilot - Code completion, debugging assistance, and refactoring
- Human Review - All AI-generated code reviewed and refined by developers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔮 Future Roadmap

- [ ] Multi-collateral support (ERC20, NFTs)
- [ ] Automated interest calculations
- [ ] Credit scoring system
- [ ] Governance token (VAULT)
- [ ] Mobile app (React Native)
- [ ] Layer 2 scaling integration
- [ ] DeFi protocol integrations
- [ ] Advanced analytics dashboard

See [Roadmap](./docs/roadmap.md) for detailed timeline.

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/ivocreates/chainvalut/wiki)
- **Issues**: [GitHub Issues](https://github.com/ivocreates/chainvalut/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ivocreates/chainvalut/discussions)

## ⚠️ Disclaimer

ChainVault is experimental software. Use at your own risk. Always review smart contract code before interacting with it. Never invest more than you can afford to lose.

---

**Built with ❤️ by the ChainVault Team**

[Website](#) | [Twitter](#) | [Discord](#) | [Medium](#)
