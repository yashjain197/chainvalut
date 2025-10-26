# ChainVault - Decentralized P2P Lending Platform 🔐

<div align="center">

![Version](https://img.shields.io/badge/Version-2.0-blue?style=for-the-badge) 
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge) 
![Ethereum](https://img.shields.io/badge/Network-Ethereum-purple?style=for-the-badge)
![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-363636?style=for-the-badge&logo=solidity)
![Tests](https://img.shields.io/badge/Tests-28%20Passed-success?style=for-the-badge)

**Secure, privacy-preserving Ethereum vault with P2P lending and encrypted nominee inheritance**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Architecture](#-architecture) • [Security](#-security)

</div>

---

## 📖 Overview

**ChainVault** is a comprehensive decentralized finance (DeFi) platform built on Ethereum that combines peer-to-peer lending, secure vault management, and privacy-preserving inheritance functionality. Users can lend and borrow ETH with complete control, designate beneficiaries (nominees) who can claim funds after prolonged inactivity, and manage automated payroll systems—all while maintaining maximum privacy through Lit Protocol encryption.

### Why ChainVault?

- 🔒 **Privacy-First**: Nominee data and lending terms encrypted with Lit Protocol
- 💸 **P2P Lending**: Direct lending and borrowing with customizable terms
- ⏰ **Automatic Inheritance**: Nominees can claim funds after 365 days of user inactivity
- 💰 **Fair Distribution**: Proportional shares for multiple beneficiaries
- 🛡️ **Battle-Tested**: Built with OpenZeppelin, comprehensive tests, gas-optimized
- 🔧 **Flexible**: Full vault operations, automated payroll, real-time chat

---

## ✨ Features

### Core Functionality
- ✅ **Secure Vault System** - Smart contract-based vault for depositing and managing ETH
- ✅ **Deposit, Withdraw, Pay** - Full vault operations with activity tracking
- ✅ **Transaction History** - Track last 100 transactions per user
- ✅ **Real-Time Balance** - Live balance tracking and updates

### P2P Lending Marketplace
- ✅ **Custom Loan Terms** - Set interest rates (1-50% APY) and durations (1-365 days)
- ✅ **Collateral-Based** - 150% collateralization ratio for security
- ✅ **Real-Time Chat** - Negotiate terms directly with counterparties
- ✅ **Loan Tracking** - Monitor active loans with countdown timers
- ✅ **Automated Repayment** - Interest calculations and default protection

### Nominee Inheritance System
- ✅ **Encrypted Setup** - Store nominee data privately via Lit Protocol
- ✅ **Proportional Shares** - Define percentages (must sum to 100%)
- ✅ **Inactivity Tracking** - Automatic detection after 365 days
- ✅ **One-Time Claims** - Each nominee claims once (no double-dipping)
- ✅ **Activity Ping** - Reset timer without moving funds
- ✅ **Update/Remove** - Change nominees anytime while active

### Advanced Features
- ✅ **Automated Payroll** - Schedule recurring payments with signature authorization
  - Multiple frequencies (daily, weekly, monthly, custom)
  - Multi-recipient support with saved batches
  - Real-time status tracking
  
- ✅ **Nominee Management** - Designate trusted representatives
  - Set spending limits and permissions
  - Activity tracking and audit logs

### Privacy & Security
- ✅ **Lit Protocol Encryption** - Private lending terms, payroll data, chat messages
- ✅ **ReentrancyGuard** - Protected ETH transfers
- ✅ **Pausable** - Emergency stop mechanism
- ✅ **Access Control** - Role-based permissions
- ✅ **Input Validation** - All parameters checked
- ✅ **Custom Errors** - Gas-efficient error handling

### User Experience
- ✅ **Multi-Network Support** - Ethereum, Sepolia, Optimism, Arbitrum, Polygon, Base, BSC
- ✅ **ENS Integration** - Display ENS names and avatars
- ✅ **Blockscout Explorer** - Integrated transaction transparency
- ✅ **Responsive Design** - Mobile-friendly interface
- ✅ **Modern UI** - Dark theme with gradient accents
- ✅ **Real-Time Updates** - Instant balance and transaction updates

---

## 🚀 Quick Start

### Prerequisites

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install Node.js v18+
# Install MetaMask browser extension
```

### Installation

```bash
# Clone repository
git clone https://github.com/ivocreates/chainvalut.git
cd chainvalut

# Install all dependencies
make install

# Or install separately
cd dapp && npm install
cd ../contracts && forge install
```

### Build & Test

```bash
# Compile contracts
make build

# Run all tests (28 tests)
make test

# Run with gas report
make test-gas

# Start dev server
cd dapp
npm run dev
```

### Deploy

```bash
# Set environment variables
cp .env.example .env
# Edit .env with your PRIVATE_KEY and RPC URLs

# Deploy to Sepolia testnet
make deploy-sepolia

# Deploy frontend to Firebase
cd dapp
npm run build
firebase deploy
```

---

## 📚 Documentation

All detailed documentation is available in the `/docs` folder:

### Setup & Configuration
- [Getting Started](./docs/GETTING_STARTED.md) - Complete installation guide
- [Firebase Setup](./docs/FIREBASE_SETUP.md) - Database configuration
- [WalletConnect Setup](./docs/WALLETCONNECT_SETUP.md) - Multi-wallet support

### Core Documentation
- [Complete Feature List](./docs/FEATURES.md) - All platform features
- [Architecture Guide](./docs/ARCHITECTURE.md) - System design and technical details
- [User Guide](./docs/USER_GUIDE.md) - End-user documentation
- [Project Overview](./docs/PROJECT_OVERVIEW.md) - High-level summary

### Integration Guides
- [Lit Protocol Integration](./docs/INTEGRATIONS.md#lit-protocol) - Privacy and encryption
- [Blockscout Integration](./docs/INTEGRATIONS.md#blockscout) - Blockchain explorer
- [Nominee System](./contracts/NOMINEE_README.md) - Complete inheritance documentation

### Development
- [Development Attribution](./docs/DEVELOPMENT_ATTRIBUTION.md) - Code authorship and AI usage
- [Quick Start Guide](./QUICKSTART.md) - 5-minute setup

---

## 🏗️ Architecture

### Smart Contracts

```
ChainVaultCore.sol (Base)
├── Deposit/Withdraw/Pay functions
├── Balance tracking
├── Transaction history
├── Lending/Borrowing logic
├── Payroll scheduling
└── Pausable/Ownable

NomineeVault.sol (Extension)
├── Extends ChainVaultCore
├── Nominee management (set/update/remove)
├── Inactivity tracking (365 days)
├── Proportional claim mechanism
└── Activity pinging
```

### Frontend (dApp)
- **Framework**: React 19 + Vite 6
- **Web3**: Wagmi v2 + Ethers v6
- **Styling**: Custom CSS with modern gradients
- **Database**: Firebase Realtime Database
- **Encryption**: Lit Protocol SDK v7
- **Wallet**: RainbowKit + WalletConnect

### Key Technologies
- **ENS**: Ethereum Name Service for profiles
- **Blockscout**: Blockchain explorer integration
- **Lit Protocol**: Threshold encryption (DatilTest network)
- **Firebase**: Real-time database and hosting
- **Foundry**: Smart contract testing and deployment

---

## 💻 Tech Stack

**Frontend:**
- React 19.0
- Vite 6.0
- Wagmi v2.15
- Ethers v6.13
- Lit Protocol v7
- Firebase SDK
- RainbowKit

**Smart Contracts:**
- Solidity ^0.8.20
- Foundry (Forge, Cast, Anvil)
- OpenZeppelin Contracts v5.2
- Chainlink Price Feeds

**Infrastructure:**
- Firebase (Database + Hosting)
- Ethereum Sepolia Testnet
- Lit Protocol DatilTest Network
- Blockscout Explorer API

---

## 🔐 Lit Protocol Integration

### How It Works

1. **Setup Phase**
   ```javascript
   // User encrypts nominee data off-chain
   const encrypted = await encryptNomineeData({
     nomineeAddresses: ['0xAlice...', '0xBob...'],
     shares: [60, 40],
     litClient,
   });
   
   // Store encrypted bytes on-chain
   await contract.setNominees(encrypted.data, addresses, shares);
   ```

2. **Inactivity Phase**
   - User doesn't interact for 365 days
   - `lastActivity + inactivityPeriod < currentTime`

3. **Claim Phase**
   ```javascript
   // Nominee decrypts data (Lit verifies inactivity on-chain)
   const nominees = await decryptNomineeData({
     ciphertext: encrypted.ciphertext,
     litClient,
   });
   
   // Claim proportional share
   await contract.claimNomineeShare(userAddress, nomineeIndex);
   ```

### Privacy Guarantee

- ✅ No plaintext nominee data on-chain
- ✅ Threshold encryption (decentralized key management)
- ✅ Access conditions verified by Lit nodes
- ✅ Only decryptable when user is inactive

---

## 🧪 Testing

### Test Suite

```bash
forge test -vv
```

**28 Tests, 100% Pass Rate**

| Category | Tests | Description |
|----------|-------|-------------|
| Basic Functionality | 5 | Deposit, withdraw, pay with activity tracking |
| Nominee Setup | 6 | Valid/invalid shares, self-nomination, updates |
| Inactivity & Claims | 9 | Timer expiration, claims, double-claim prevention |
| Admin Functions | 5 | Inactivity period, pause/unpause |
| Edge Cases | 3 | Zero balance, multiple nominees, premature claims |

### Sample Output

```
[PASS] test_ClaimNomineeShareAfterInactivity (gas: 626379)
[PASS] test_SetNomineesSuccess (gas: 462867)
[PASS] test_ClaimFailsBeforeInactivity (gas: 361031)
...
Suite result: ok. 28 passed; 0 failed; 0 skipped
```

---

## 📊 Gas Costs

| Function | Avg Gas | Notes |
|----------|---------|-------|
| `deposit` (with tracking) | ~52k | +3k over base |
| `setNominees(2 nominees)` | ~180k | One-time setup |
| `claimNomineeShare` | ~95k | Per nominee |
| `pingActivity` | ~45k | Activity reset |
| `requestLoan` | ~120k | Create lending offer |
| `repayLoan` | ~85k | Repay with interest |

---

## 🎯 Use Cases

1. **Personal Lending** - Lend ETH to friends/family with customized terms
2. **Business Payroll** - Automate salary payments to employees with saved batches
3. **Family Inheritance** - Set spouse (60%) and children (40%) as beneficiaries
4. **Business Continuity** - Emergency fund access if CEO becomes inactive
5. **Trust Funds** - Lock funds until child's inheritance (after parent's inactivity)
6. **DAO Treasury** - Multi-sig members as nominees for inactive member's funds
7. **DeFi Integration** - Use vault as collateral or for yield farming
8. **Secure Storage** - Store ETH with encryption and access controls

---

## 🔗 Networks

ChainVault supports the following networks:

- **Ethereum Mainnet** (Chain ID: 1)
- **Sepolia Testnet** (Chain ID: 11155111) ⭐ Primary
- **Optimism** (Chain ID: 10)
- **Arbitrum** (Chain ID: 42161)
- **Polygon** (Chain ID: 137)
- **Base** (Chain ID: 8453)
- **BSC** (Chain ID: 56)

---

## 📝 Smart Contracts

**ChainVaultCore.sol** - Main contract deployed on Sepolia:
- Address: `[Deployed Contract Address]`
- Explorer: [View on Blockscout](https://eth-sepolia.blockscout.com)

**Key Functions:**
- `deposit()` - Deposit ETH into vault
- `withdraw()` - Withdraw ETH from vault
- `pay()` - Send ETH to another user
- `requestLoan()` - Create a lending offer
- `fundLoan()` - Fund a borrower's request
- `repayLoan()` - Repay an active loan
- `setNominees()` - Set encrypted nominee beneficiaries
- `claimNomineeShare()` - Claim inheritance after inactivity
- `addNominee()` - Add trusted representative for account management
- `schedulePayroll()` - Create automated payment schedule

---

## 🛡️ Security

### Audits
- ⚠️ **Not yet audited** - recommended before mainnet deployment
- ✅ Built with OpenZeppelin battle-tested contracts
- ✅ Comprehensive test suite (28 tests, 100% pass rate)

### Security Features
- ✅ ReentrancyGuard on all ETH transfers
- ✅ Pausable for emergency stops
- ✅ Input validation on all functions
- ✅ Custom errors (gas-efficient)
- ✅ No external calls except owner-controlled
- ✅ Access control with role-based permissions

### Recommendations
1. Run Slither: `make slither`
2. Deploy to testnet first
3. Get professional audit before mainnet
4. Test with real accounts on testnet
5. Use hardware wallet for mainnet deployment

---

## 🛠️ Development

### Running Locally

```bash
# Start development server
cd dapp
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

# Generate coverage report
make coverage
```

### Development Commands

```bash
# Installation
make install              # Install all dependencies
make install-contracts    # Install contract dependencies only

# Building
make build               # Compile contracts
make clean               # Clean build artifacts

# Testing
make test                # Run all tests
make test-verbose        # Run with verbose output
make test-gas            # Run with gas report
make coverage            # Generate coverage report

# Deployment
make deploy-sepolia      # Deploy to Sepolia
make deploy-mainnet      # Deploy to Mainnet

# Frontend
make dev                 # Start dev server
make frontend-build      # Build for production

# Analysis
make size                # Check contract sizes
make slither             # Run security analysis
```

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Run tests (`make test`)
4. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

---

## 👥 Credits

### Development Team

**UI/UX & Frontend Development**
- **Ivo Pereira** ([@ivocreates](https://github.com/ivocreates))
  - Complete UI/UX design and implementation
  - Frontend architecture and React components
  - CSS styling and responsive design
  - Feature integration and testing
  - Firebase and Web3 integrations

**Smart Contract Development**
- **MD Imran** ([@mdimran29](https://github.com/mdimran29))
  - Core smart contract architecture (ChainVaultCore.sol)
  - Solidity development and optimization
  - Chainlink oracle integration
  
- **Yash Jain** ([@yashjain197](https://github.com/yashjain197))
  - Smart contract testing and deployment
  - Security auditing and optimization
  - Nominee system implementation (NomineeVault.sol)

---

## 🤖 Development Transparency & AI Attribution

**Code Authorship Overview:**

This project represents a **collaborative development approach** combining human expertise with AI assistance as a productivity tool.

| Component | Primary Author | AI Support Level |
|-----------|----------------|------------------|
| **Smart Contracts** | Human-written | Minimal assistance |
| **UI Components** | Human-designed & coded | Moderate assistance |
| **Core Business Logic** | Human-architected | Limited assistance |
| **Integration Code** | Balanced collaboration | Significant assistance |
| **Testing & Debugging** | Human-led | Moderate assistance |
| **Documentation** | Collaborative effort | Substantial assistance |

**Human-Led Development:**
- ✅ Complete system architecture & all technical decisions
- ✅ All smart contract security patterns & implementations
- ✅ Full UI/UX design & user experience flow
- ✅ Database schema design & structure
- ✅ Business logic & feature specifications
- ✅ Security audit & vulnerability assessment
- ✅ Testing strategy & test case design

**AI Tools Used as Development Assistants:**
- **ChatGPT** - Technical research, debugging assistance, documentation drafting
- **GitHub Copilot** - Code completion, boilerplate generation, syntax suggestions
- **Human Review & Refinement** - All AI suggestions reviewed, tested, and often significantly modified

**Quality Assurance Process:**
- Every line of code manually reviewed and tested by human developers
- AI suggestions evaluated for security, performance, and best practices
- Approximately half of AI suggestions were rejected or completely rewritten
- All critical systems (smart contracts, security, core logic) are 100% human-authored
- Security-sensitive code never delegated to AI tools

**Learn More:**
- [**Development Attribution Guide**](docs/DEVELOPMENT_ATTRIBUTION.md) - Detailed 370-line breakdown
- [**Architecture Documentation**](docs/ARCHITECTURE.md) - Complete technical design
- [**User Guide**](docs/USER_GUIDE.md) - Comprehensive usage documentation

**Our Commitment:** We believe in transparent disclosure of development tools and methods. This project demonstrates how modern AI assistants can enhance developer productivity while maintaining complete human control over architecture, security, and all critical decision-making. AI was used as a tool to augment human capabilities, not replace human expertise.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔮 Future Roadmap

- [ ] Multi-collateral support (ERC20, NFTs)
- [ ] Automated interest calculations with oracles
- [ ] Credit scoring system
- [ ] Governance token (VAULT)
- [ ] Mobile app (React Native)
- [ ] Layer 2 scaling integration (Optimism, Arbitrum)
- [ ] DeFi protocol integrations (Compound, Aave)
- [ ] Advanced analytics dashboard
- [ ] Multi-signature wallet support
- [ ] Nominee voting mechanisms

See [Project Overview](./docs/PROJECT_OVERVIEW.md) for detailed timeline.

---

## 📞 Support

- **Documentation**: [Complete Docs](./docs)
- **Issues**: [GitHub Issues](https://github.com/ivocreates/chainvalut/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ivocreates/chainvalut/discussions)
- **Live Demo**: [https://chainvault-997c7.web.app](https://chainvault-997c7.web.app)

---

## 📈 Project Stats

![Solidity](https://img.shields.io/badge/Solidity-990%20LOC-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-1030%20LOC-yellow)
![Tests](https://img.shields.io/badge/Tests-28%20Passed-green)
![Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen)
![Documentation](https://img.shields.io/badge/Documentation-4600%2B%20lines-orange)

---

## ⚠️ Disclaimer

ChainVault is experimental software under active development. Use at your own risk. Always review smart contract code before interacting with it. Never invest more than you can afford to lose. This software has not been professionally audited and should not be used with significant funds on mainnet without proper security review.

For production use:
1. Get professional security audit
2. Test extensively on testnets
3. Use hardware wallets for key management
4. Start with small amounts
5. Understand all risks involved

---

## 🙏 Acknowledgments

- **OpenZeppelin** for battle-tested contract libraries
- **Foundry** for fast and flexible testing framework
- **Lit Protocol** for decentralized encryption infrastructure
- **Ethereum** community for continuous innovation
- **Wagmi & RainbowKit** for excellent Web3 developer experience

---

<div align="center">

**Built with ❤️ by the ChainVault Team**

[⭐ Star on GitHub](https://github.com/ivocreates/chainvalut) • [📖 Read the Docs](./docs) • [🚀 Get Started](#-quick-start) • [💬 Join Discussion](https://github.com/ivocreates/chainvalut/discussions)

**Live Demo:** [https://chainvault-997c7.web.app](https://chainvault-997c7.web.app)

</div>