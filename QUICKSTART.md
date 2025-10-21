# Quick Start Guide - NomineeVault

## 🚀 5-Minute Setup

### 1. Install Dependencies

```bash
# Contracts
cd contracts
forge install OpenZeppelin/openzeppelin-contracts

# Frontend
cd ../dapp
npm install ethers @lit-protocol/lit-node-client
```

### 2. Deploy Contract

```bash
cd contracts

# Set your private key
export PRIVATE_KEY=0xYourPrivateKey

# Deploy to Sepolia testnet
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://sepolia.infura.io/v3/YOUR_KEY \
  --broadcast

# Note the deployed address
```

### 3. Update Frontend Config

```javascript
// dapp/src/lib/litProtocol.js
const NOMINEE_VAULT_ADDRESS = '0xYourDeployedAddress';
```

### 4. Run Frontend

```bash
cd dapp
npm run dev
# Open http://localhost:5173
```

---

## 📝 Basic Usage Flow

### A. Setup Nominees (User)

```javascript
import { initLitClient, setupNominees } from './lib/litProtocol.js';

// 1. Connect wallet
const signer = provider.getSigner();

// 2. Initialize Lit
const litClient = await initLitClient();

// 3. Setup nominees
await setupNominees({
  nomineeAddresses: ['0xAlice...', '0xBob...'],
  shares: [60, 40], // 60% Alice, 40% Bob
  contract,
  signer,
  litClient,
});
```

### B. Claim Share (Nominee)

```javascript
// 1. Check if user is inactive
const status = await checkInactivityStatus(userAddress, contract);
// status.isInactive === true

// 2. Claim
await claimNomineeShare({
  inactiveUserAddress: userAddress,
  nomineeIndex: 0, // Your index
  metadata, // From localStorage or backend
  contract,
  signer,
  litClient,
});
```

---

## 🧪 Testing

```bash
cd contracts

# Run all tests
forge test -vv

# Run specific test
forge test --match-test test_ClaimNomineeShareAfterInactivity -vvv

# Gas report
forge test --gas-report
```

---

## 📊 Key Functions

| Function | Who Calls | When |
|----------|-----------|------|
| `setNominees` | User | Setup beneficiaries |
| `claimNomineeShare` | Nominee | After 365 days inactivity |
| `pingActivity` | User | Reset inactivity timer |
| `updateNominees` | User | Change beneficiaries |

---

## ⚠️ Important Notes

1. **Inactivity Period**: Default is 365 days
2. **Shares Must Sum to 100**: Enforced on-chain
3. **No Self-Nomination**: Contract prevents this
4. **One Claim Per Nominee**: Can't claim twice
5. **Metadata Storage**: Store Lit encryption metadata securely

---

## 🔧 Common Commands

```bash
# Compile contracts
forge build

# Run tests
forge test

# Deploy to Sepolia
forge script script/Deploy.s.sol:Deploy --rpc-url $SEPOLIA_RPC_URL --broadcast

# Verify contract
forge verify-contract <ADDRESS> NomineeVault --chain sepolia

# Run frontend
cd dapp && npm run dev
```

---

## 📚 Next Steps

1. Read `NOMINEE_README.md` for detailed documentation
2. Review test cases in `test/NomineeVault.t.sol`
3. Customize frontend components in `dapp/src/components/`
4. Deploy to testnet and test with real MetaMask accounts

---

## 🆘 Troubleshooting

**Issue**: "Shares must sum to 100"
→ Check your shares array: `[60, 40]` = 100 ✅

**Issue**: "User not inactive"
→ Wait 365 days or adjust `inactivityPeriod` (testnet only)

**Issue**: "Cannot decrypt"
→ Ensure user is actually inactive on-chain

---

**Need Help?** Open an issue on GitHub or check `NOMINEE_README.md`
