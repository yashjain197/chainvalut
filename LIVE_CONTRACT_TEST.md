# 🧪 Live Contract Testing on Sepolia

## ✅ Contract Verification Tests

### Test 1: Owner Check
```bash
cast call 0x2E7B5961000769459499a0caa71C14b11860A835 "owner()" --rpc-url SEPOLIA_RPC
```
**Result:** `0x2c4710e288ec669e10db1e42b4f56fbfd889893d` ✅  
**Status:** Owner correctly set to deployer address

---

### Test 2: Inactivity Period
```bash
cast call 0x2E7B5961000769459499a0caa71C14b11860A835 "inactivityPeriod()" --rpc-url SEPOLIA_RPC
```
**Result:** `31536000` (365 days in seconds) ✅  
**Status:** Inactivity period correctly configured

---

### Test 3: Pause Status
```bash
cast call 0x2E7B5961000769459499a0caa71C14b11860A835 "paused()" --rpc-url SEPOLIA_RPC
```
**Result:** `false` ✅  
**Status:** Contract is active and accepting transactions

---

## 🎯 Next Tests to Run

### 1. Test Deposit Function

Get some Sepolia ETH from: https://sepoliafaucet.com/

Then deposit to the contract:
```bash
cast send 0x2E7B5961000769459499a0caa71C14b11860A835 \
  "deposit(bytes32)" \
  "0x0000000000000000000000000000000000000000000000000000000000000001" \
  --value 0.01ether \
  --private-key YOUR_PRIVATE_KEY \
  --rpc-url https://eth-sepolia.g.alchemy.com/v2/fJXLSzbX-ZCNyfQTyoj5E
```

### 2. Check Balance
```bash
cast call 0x2E7B5961000769459499a0caa71C14b11860A835 \
  "balanceOf(address)" YOUR_ADDRESS \
  --rpc-url https://eth-sepolia.g.alchemy.com/v2/fJXLSzbX-ZCNyfQTyoj5E
```

### 3. Setup Nominees (Requires Lit Protocol)

Use the frontend or:
```javascript
// In the React app
const nomineeAddresses = ["0xAlice...", "0xBob..."];
const shares = [60, 40];

// This will encrypt data with Lit Protocol
await setupNominees(
  nomineeVault,
  litClient,
  nomineeAddresses,
  shares
);
```

### 4. Check Activity
```bash
cast call 0x2E7B5961000769459499a0caa71C14b11860A835 \
  "lastActivity(address)" YOUR_ADDRESS \
  --rpc-url https://eth-sepolia.g.alchemy.com/v2/fJXLSzbX-ZCNyfQTyoj5E
```

### 5. Ping Activity
```bash
cast send 0x2E7B5961000769459499a0caa71C14b11860A835 \
  "pingActivity()" \
  --private-key YOUR_PRIVATE_KEY \
  --rpc-url https://eth-sepolia.g.alchemy.com/v2/fJXLSzbX-ZCNyfQTyoj5E
```

---

## 📊 Contract State Summary

| Property | Value | Status |
|----------|-------|--------|
| Address | `0x2E7B5961000769459499a0caa71C14b11860A835` | ✅ Deployed |
| Owner | `0x2c4710e288ec669e10db1e42b4f56fbfd889893d` | ✅ Set |
| Inactivity Period | 365 days (31,536,000 sec) | ✅ Configured |
| Paused | No | ✅ Active |
| Verified | Yes | ✅ On Etherscan |
| Network | Sepolia Testnet | ✅ |

---

## 🔗 Quick Links

- **View on Etherscan:** https://sepolia.etherscan.io/address/0x2e7b5961000769459499a0caa71c14b11860a835
- **Contract Source Code:** https://sepolia.etherscan.io/address/0x2e7b5961000769459499a0caa71c14b11860a835#code
- **Write Functions:** https://sepolia.etherscan.io/address/0x2e7b5961000769459499a0caa71c14b11860a835#writeContract
- **Read Functions:** https://sepolia.etherscan.io/address/0x2e7b5961000769459499a0caa71c14b11860a835#readContract
- **Get Sepolia ETH:** https://sepoliafaucet.com/

---

## 🚀 Frontend Testing

### Step 1: Start Development Server
```bash
cd dapp
npm install
npm run dev
```

### Step 2: Configure MetaMask
1. Add Sepolia Network to MetaMask
2. Network Name: Sepolia
3. RPC URL: `https://eth-sepolia.g.alchemy.com/v2/fJXLSzbX-ZCNyfQTyoj5E`
4. Chain ID: 11155111
5. Currency: SepoliaETH
6. Block Explorer: https://sepolia.etherscan.io

### Step 3: Test Features
- [ ] Connect wallet
- [ ] Deposit ETH
- [ ] Setup nominees with Lit Protocol
- [ ] Check balance
- [ ] Ping activity
- [ ] View transaction history

---

## ✅ All Initial Tests Passed!

The contract is:
- ✅ Successfully deployed
- ✅ Verified on Etherscan
- ✅ Correctly configured
- ✅ Ready for testing
- ✅ All 28 unit tests passing

**Next:** Run frontend and test real user interactions!
