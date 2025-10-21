# NomineeVault - Encrypted Inheritance Module for ChainVault

A Solidity smart contract module that extends ChainVault with encrypted nominee/inheritance functionality using Lit Protocol for privacy-preserving beneficiary management.

## 🎯 Overview

**NomineeVault** allows users to designate nominees (beneficiaries) who can claim vault funds if the user becomes inactive (e.g., due to death or prolonged absence). All nominee data is encrypted using Lit Protocol's threshold encryption, ensuring privacy until access conditions are met.

### Key Features

- ✅ **Encrypted Nominee Setup**: Store nominees privately using Lit Protocol
- ✅ **Proportional Distribution**: Split funds by percentage (must sum to 100%)
- ✅ **Inactivity Tracking**: Automatic activity monitoring on all interactions
- ✅ **Configurable Inactivity Period**: Default 365 days (owner-adjustable: 30-730 days)
- ✅ **One-Time Claims**: Each nominee can claim only once
- ✅ **Activity Ping**: Users can reset timer without moving funds
- ✅ **Pausable Claims**: Owner can emergency-pause claims
- ✅ **Gas Optimized**: Efficient mappings and minimal storage

---

## 📁 Project Structure

```
chainvalut/
├── contracts/
│   ├── src/
│   │   ├── ChainVaultCore.sol      # Base vault contract
│   │   └── NomineeVault.sol        # Nominee inheritance module
│   ├── script/
│   │   └── Deploy.s.sol            # Foundry deployment scripts
│   ├── test/
│   │   └── NomineeVault.t.sol      # Comprehensive test suite
│   └── foundry.toml                # Foundry configuration
└── dapp/
    └── src/
        ├── lib/
        │   └── litProtocol.js       # Lit Protocol integration
        └── components/
            ├── NomineeSetup.jsx     # React component: Setup nominees
            └── NomineeClaim.jsx     # React component: Claim shares
```

---

## 🚀 Getting Started

### Prerequisites

- **Foundry**: Install via `curl -L https://foundry.paradigm.xyz | bash && foundryup`
- **Node.js**: v16+ for frontend
- **MetaMask**: Browser wallet for testing

### Installation

#### 1. Contracts Setup

```bash
cd contracts

# Install dependencies (OpenZeppelin)
forge install OpenZeppelin/openzeppelin-contracts

# Compile contracts
forge build

# Run tests
forge test -vv

# Run specific test
forge test --match-test test_ClaimNomineeShareAfterInactivity -vvv
```

#### 2. Frontend Setup

```bash
cd dapp

# Install dependencies
npm install ethers @lit-protocol/lit-node-client

# Start dev server
npm run dev
```

---

## 📜 Smart Contract API

### Core Functions

#### `setNominees(bytes encryptedData, address[] nomineeAddresses, uint256[] shares)`
Set nominees with encrypted data from Lit Protocol.

**Parameters:**
- `encryptedData`: Encrypted nominee info (hex string from Lit SDK)
- `nomineeAddresses`: Array of nominee addresses (for validation)
- `shares`: Array of percentages (must sum to 100)

**Requirements:**
- Shares sum to 100
- No self-nomination
- No zero addresses
- Arrays equal length

**Events:** `NomineesSet(address user, bytes encryptedData, uint256 nomineeCount, uint256 timestamp)`

---

#### `claimNomineeShare(address user, uint256 nomineeIndex)`
Claim proportional share after user inactivity.

**Parameters:**
- `user`: Inactive user's address
- `nomineeIndex`: Index in the shares array (0-based)

**Requirements:**
- User inactive (>365 days)
- Nominee index valid
- Not already claimed
- Caller is registered nominee
- Claims not paused

**Events:** `NomineeClaimed(address user, address nominee, uint256 amount, uint256 share, uint256 index, uint256 timestamp)`

---

#### `pingActivity(bytes32 ref)`
Manually reset inactivity timer without moving funds.

**Use Case:** User wants to prove "alive" status

**Events:** `ActivityPinged(address user, uint256 timestamp)`

---

#### `updateNominees(bytes encryptedData, address[] nomineeAddresses, uint256[] shares)`
Update existing nominee configuration.

**Note:** Resets all claim states

---

#### `removeNominees()`
Remove all nominees and clear configuration.

---

### View Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `isUserInactive(address user)` | `bool` | Check if user exceeded inactivity period |
| `timeUntilInactive(address user)` | `uint256` | Seconds until inactive (0 if already) |
| `getEncryptedNomineeData(address user)` | `bytes` | Encrypted nominee data |
| `getNomineeConfig(address user)` | `NomineeData` | Full nominee configuration |
| `isShareClaimed(address user, uint256 index)` | `bool` | Check if nominee claimed |
| `getNomineeShare(address user, uint256 index)` | `uint256` | Share percentage for index |

---

### Admin Functions

#### `setInactivityPeriod(uint256 newPeriod)`
Update inactivity period (30-730 days).

**Only Owner**

---

#### `setClaimsPaused(bool paused)`
Emergency pause/unpause claims.

**Only Owner**

---

## 🔐 Lit Protocol Integration

### Setup Flow

```javascript
import { initLitClient, setupNominees } from './lib/litProtocol.js';
import { ethers } from 'ethers';

// 1. Initialize Lit client
const litClient = await initLitClient();

// 2. Define nominees
const nomineeAddresses = ['0xNominee1...', '0xNominee2...'];
const shares = [60, 40]; // Must sum to 100

// 3. Setup (encrypts + stores on-chain)
const { receipt, metadata } = await setupNominees({
  nomineeAddresses,
  shares,
  contract: vaultContract, // Ethers contract instance
  signer: ethersigner,
  litClient,
});

// 4. Store metadata securely (production: use backend)
localStorage.setItem(`nominee_metadata_${userAddress}`, JSON.stringify(metadata));
```

### Claim Flow

```javascript
import { claimNomineeShare, checkInactivityStatus } from './lib/litProtocol.js';

// 1. Check inactivity
const status = await checkInactivityStatus(userAddress, contract);
console.log('Inactive:', status.isInactive);

// 2. Retrieve metadata (from local storage or backend)
const metadata = JSON.parse(localStorage.getItem(`nominee_metadata_${userAddress}`));

// 3. Claim (decrypts via Lit, then claims on-chain)
const { receipt, claimAmount } = await claimNomineeShare({
  inactiveUserAddress: userAddress,
  nomineeIndex: 0, // Your index
  metadata,
  contract,
  signer,
  litClient,
});

console.log(`Claimed ${claimAmount} ETH`);
```

---

## 🧪 Testing

### Run All Tests

```bash
forge test -vv
```

### Test Coverage

| Category | Tests |
|----------|-------|
| **Basic Functionality** | Deposit, withdraw, pay tracking activity |
| **Nominee Setup** | Valid/invalid shares, self-nomination prevention |
| **Inactivity** | Claim after period, premature claims, timer resets |
| **Claims** | Proportional distribution, double-claim prevention, non-nominee rejection |
| **Admin** | Inactivity period updates, pause/unpause claims |
| **Edge Cases** | Zero balance, multiple nominees, update/remove |

### Example Test Output

```
[PASS] test_ClaimNomineeShareAfterInactivity (gas: 245678)
[PASS] test_SetNomineesSuccess (gas: 178234)
[PASS] test_ClaimFailsBeforeInactivity (gas: 112456)
```

---

## 🛠 Deployment

### Sepolia Testnet

```bash
# Set environment variables
export PRIVATE_KEY=0xYourPrivateKey
export SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY

# Deploy
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key YOUR_ETHERSCAN_KEY

# Output:
# NomineeVault deployed at: 0x...
```

### Mainnet Deployment

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $MAINNET_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key YOUR_ETHERSCAN_KEY \
  --slow # Use for mainnet safety
```

---

## 📊 Gas Optimization

| Function | Avg Gas | Notes |
|----------|---------|-------|
| `setNominees(2 nominees)` | ~180k | One-time setup |
| `claimNomineeShare` | ~95k | Per nominee claim |
| `pingActivity` | ~45k | Activity reset |
| `deposit` (with tracking) | ~52k | +3k over base vault |

**Optimization Techniques:**
- Mappings over arrays for O(1) lookups
- Packed storage (NomineeData struct)
- Minimal on-chain storage (encrypted bytes only)
- History capped at 100 entries

---

## 🔒 Security Considerations

### Contract Security

✅ **ReentrancyGuard**: All external functions with ETH transfers
✅ **Pausable**: Emergency stop mechanism
✅ **Ownable**: Access control for admin functions
✅ **Input Validation**: All parameters checked
✅ **SafeMath**: Solidity 0.8.20+ built-in overflow protection

### Lit Protocol Security

- **Threshold Encryption**: Decentralized key management (no single point of failure)
- **Access Control Conditions**: On-chain verifiable conditions
- **No Plaintext Storage**: Nominees never exposed on-chain

### Best Practices

1. **Metadata Storage**: Use encrypted backend (not localStorage in production)
2. **Key Management**: Secure private keys with hardware wallets
3. **Audit**: Get professional audit before mainnet deployment
4. **Testing**: Run `forge test` and `slither .` for static analysis

---

## 🌐 Frontend Integration

### React Example

```jsx
import NomineeSetup from './components/NomineeSetup';
import NomineeClaim from './components/NomineeClaim';

function App() {
  return (
    <div>
      <h1>ChainVault Nominee Management</h1>
      <NomineeSetup />
      <NomineeClaim />
    </div>
  );
}
```

### MetaMask Connection

```javascript
// Connect wallet
const provider = new ethers.providers.Web3Provider(window.ethereum);
await provider.send('eth_requestAccounts', []);
const signer = provider.getSigner();

// Initialize contract
const contract = new ethers.Contract(ADDRESS, ABI, signer);
```

---

## 📖 Use Cases

### 1. **Family Inheritance**
User sets spouse (60%) and children (40%) as nominees. After 365 days inactivity, they can claim.

### 2. **Business Continuity**
Company wallet sets board members as nominees for emergency fund access.

### 3. **Trust Funds**
Parent sets child as 100% nominee, locked until inactivity (e.g., child turns 18).

### 4. **DAO Treasury**
DAO sets multi-sig nominees for inactive member's delegated funds.

---

## 🔧 Troubleshooting

### Issue: "Cannot decrypt: User is not yet inactive"
**Solution**: Wait until `inactivityPeriod` expires or adjust period (testnet only).

### Issue: "Shares must sum to 100%"
**Solution**: Ensure `shares.reduce((a,b) => a+b) === 100`.

### Issue: "MetaMask not detected"
**Solution**: Install MetaMask browser extension.

### Issue: "Transaction reverted: NotANominee"
**Solution**: Ensure you're calling with the correct nominee address for the given index.

---

## 📚 Additional Resources

- **Foundry Book**: https://book.getfoundry.sh/
- **Lit Protocol Docs**: https://developer.litprotocol.com/
- **OpenZeppelin Contracts**: https://docs.openzeppelin.com/contracts/
- **Ethers.js Docs**: https://docs.ethers.org/

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Run tests: `forge test`
4. Commit changes: `git commit -m "Add feature"`
5. Push: `git push origin feature/new-feature`
6. Open Pull Request

---

## 📄 License

MIT License - See `LICENSE` file for details.

---

## ⚠️ Disclaimer

This is experimental software. Use at your own risk. Always audit smart contracts before deploying to mainnet. Never store large amounts without professional security review.

---

## 📞 Support

- **Issues**: Open a GitHub issue
- **Discussions**: Use GitHub Discussions
- **Security**: Report vulnerabilities to security@chainvault.example

---

**Built with ❤️ for the Ethereum community**
