# ChainVault System Architecture

> Complete technical architecture and implementation details

## Overview

ChainVault is built on a modern, decentralized architecture combining blockchain smart contracts with real-time web technologies. The system emphasizes security, user experience, and scalability.

---

## System Components

### Frontend Layer

**Technology Stack:**
- React 19.0 - Component-based UI framework
- Vite 7.1 - Lightning-fast build tool
- CSS3 - Custom styling with modern features
- Progressive Web App capabilities

**Key Features:**
- Component-based architecture
- Real-time state management
- Responsive design (mobile-first approach)
- Toast notification system
- Hot module replacement for development

**Component Structure:**
```
src/
├── components/
│   ├── ActionPanel.jsx      - Deposit/Withdraw/Pay interface
│   ├── BalanceCard.jsx       - Balance display with auto-refresh
│   ├── LendingMarketplace.jsx - P2P lending interface
│   ├── Payroll.jsx           - Multi-recipient payments
│   ├── Chat.jsx              - Encrypted messaging
│   └── Profile.jsx           - User profile management
├── hooks/
│   ├── useEnhancedWeb3.js    - Web3 connection management
│   ├── useENS.js             - ENS name resolution
│   └── useLit.js             - Encryption handling
└── config/
    ├── wagmi.js              - Web3 configuration
    └── firebase.js           - Database configuration
```

---

### Blockchain Layer

**Smart Contract: ChainVaultCore.sol**

```solidity
// Core contract address (Sepolia Testnet)
0xE6f6139929D658d31c5301F02bD8F5cE0b12Ffa4
```

**Architecture Patterns:**
- **ReentrancyGuard** - Prevents reentrancy attacks
- **Ownable** - Admin access control
- **Checks-Effects-Interactions** - Secure transaction ordering
- **Emergency Pause** - Circuit breaker mechanism

**State Management:**
```solidity
// User balances
mapping(address => uint256) public balances;

// Transaction history (circular buffer)
mapping(address => TxRecord[50]) private history;

// System totals
uint256 public totalLiabilities;

// Payroll management
mapping(address => PayrollRecipient[]) private payrollRecipients;
```

**Core Functions:**
1. `deposit(bytes32 ref)` - Add ETH to vault
2. `withdraw(uint256 amount, address to, bytes32 ref)` - Remove ETH
3. `pay(address to, uint256 amount, bytes32 ref)` - Internal transfer
4. `addPayrollRecipients()` - Batch recipient setup
5. `payAllPayroll(bytes32 ref)` - Execute batch payments

---

### Data Layer

**Firebase Realtime Database**

**Schema Design:**
```json
{
  "users": {
    "<walletAddress>": {
      "displayName": "string",
      "avatar": "url",
      "joinedAt": "timestamp"
    }
  },
  
  "lendingOffers": {
    "<offerId>": {
      "lenderAddress": "address",
      "amount": "number",
      "interestRate": "number",
      "duration": "days",
      "status": "active|filled|cancelled"
    }
  },
  
  "borrows": {
    "<borrowerAddress>": {
      "<loanId>": {
        "lenderAddress": "address",
        "amount": "number",
        "totalRepayment": "number",
        "dueDate": "timestamp",
        "status": "active|completed|overdue"
      }
    }
  },
  
  "lenderLoans": {
    "<lenderAddress>": {
      "<loanId>": {
        "borrowerAddress": "address",
        "amount": "number",
        "totalRepayment": "number"
      }
    }
  },
  
  "conversations": {
    "<conversationId>": {
      "participants": ["address1", "address2"],
      "lastMessage": "text",
      "unreadCount": { "address1": 0 }
    }
  },
  
  "messages": {
    "<conversationId>": {
      "<messageId>": {
        "senderId": "address",
        "text": "content",
        "timestamp": "timestamp"
      }
    }
  },
  
  "payrollBatches": {
    "<ownerAddress>": {
      "<batchId>": {
        "name": "string",
        "recipients": [{
          "wallet": "address",
          "amount": "number",
          "name": "string"
        }],
        "totalAmount": "number"
      }
    }
  }
}
```

**Security Rules:**
```json
{
  "rules": {
    ".read": false,
    ".write": false,
    
    "lendingOffers": {
      ".read": true,
      ".write": true
    },
    
    "borrows": {
      "$userAddress": {
        ".read": true,
        ".write": true
      }
    },
    
    "lenderLoans": {
      "$lenderAddress": {
        ".read": true,
        ".write": true
      }
    },
    
    "conversations": {
      ".read": true,
      ".write": true
    },
    
    "messages": {
      "$conversationId": {
        ".read": true,
        ".write": true
      }
    },
    
    "payrollBatches": {
      "$userAddress": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

---

## Web3 Integration

### Wallet Connection

**RainbowKit + Wagmi Configuration:**
```javascript
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

const config = getDefaultConfig({
  appName: 'ChainVault',
  projectId: 'YOUR_PROJECT_ID',
  chains: [sepolia],
  ssr: false
});
```

**Supported Wallets:**
- MetaMask
- WalletConnect (mobile & desktop)
- Coinbase Wallet
- Rainbow Wallet
- Trust Wallet
- Ledger & Trezor (hardware wallets)

### Contract Interaction

**useEnhancedWeb3 Hook:**
```javascript
export const useEnhancedWeb3 = () => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [state, setState] = useState({
    contract: null,
    balance: '0',
    ethBalance: '0'
  });

  // Initialize contract
  useEffect(() => {
    if (walletClient && address) {
      const signer = await walletClient.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );
      setState(prev => ({ ...prev, contract }));
    }
  }, [walletClient, address]);

  // Auto-update balances
  useEffect(() => {
    const interval = setInterval(async () => {
      if (contract && address) {
        const vaultBal = await contract.balanceOf(address);
        const walletBal = await publicClient.getBalance({ address });
        
        setState(prev => ({
          ...prev,
          balance: ethers.formatEther(vaultBal),
          ethBalance: ethers.formatEther(walletBal)
        }));
      }
    }, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, [contract, address]);

  return state;
};
```

---

## Security Architecture

### Smart Contract Security

**1. ReentrancyGuard Implementation:**
```solidity
abstract contract ReentrancyGuard {
    uint256 private _status = 1;
    
    modifier nonReentrant() {
        require(_status != 2, "REENTRANCY");
        _status = 2;
        _;
        _status = 1;
    }
}
```

**2. Checks-Effects-Interactions Pattern:**
```solidity
function withdraw(uint256 amount, address payable to, bytes32 ref) external {
    // Checks
    require(amount > 0, "Amount must be greater than 0");
    require(balances[msg.sender] >= amount, "Insufficient balance");
    
    // Effects
    balances[msg.sender] -= amount;
    totalLiabilities -= amount;
    
    // Interactions
    (bool success, ) = to.call{value: amount}("");
    require(success, "Transfer failed");
}
```

**3. Custom Errors (Gas Optimization):**
```solidity
error InsufficientBalance(uint256 available, uint256 required);
error InvalidAddress();
error ZeroAmount();
error TransferFailed();
error PausedError();
```

**4. Emergency Controls:**
```solidity
bool public paused;

modifier whenNotPaused() {
    if (paused) revert PausedError();
    _;
}

function pause() external onlyOwner {
    paused = true;
    emit Paused(msg.sender);
}
```

### Frontend Security

**1. Input Validation:**
```javascript
const validateAddress = (address) => {
  if (!ethers.isAddress(address)) {
    throw new Error('Invalid Ethereum address');
  }
  return address;
};

const validateAmount = (amount) => {
  const parsed = parseFloat(amount);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error('Invalid amount');
  }
  return parsed;
};
```

**2. Transaction Verification:**
```javascript
const executeTransaction = async (txFunction) => {
  try {
    const tx = await txFunction();
    const receipt = await tx.wait();
    
    if (receipt.status === 0) {
      throw new Error('Transaction reverted');
    }
    
    return receipt;
  } catch (error) {
    if (error.code === 'ACTION_REJECTED') {
      throw new Error('Transaction rejected by user');
    }
    throw error;
  }
};
```

**3. Rate Limiting:**
```javascript
const rateLimiter = {
  lastCall: 0,
  minInterval: 3000,
  
  async execute(fn) {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;
    
    if (timeSinceLastCall < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastCall = Date.now();
    return await fn();
  }
};
```

---

## Performance Optimization

### Gas Optimization

**1. Storage Optimization:**
```solidity
// Pack variables to save storage slots
struct TxRecord {
    uint64 timestamp;    // 8 bytes
    address from;        // 20 bytes
    address to;          // 20 bytes
    Action action;       // 1 byte
    uint256 amount;      // 32 bytes
    uint256 balanceAfter; // 32 bytes
    bytes32 ref;         // 32 bytes
}
```

**2. Use `calldata` for Read-Only Arrays:**
```solidity
function addPayrollRecipients(
    address[] calldata wallets,
    uint256[] calldata amounts,
    string[] calldata names
) external {
    // calldata is cheaper than memory for external functions
}
```

**3. Cache Storage Reads:**
```solidity
uint256 _balance = balances[msg.sender]; // Cache
require(_balance >= amount, "Insufficient balance");
_balance -= amount;
balances[msg.sender] = _balance; // Single write
```

### Frontend Optimization

**1. Component Memoization:**
```javascript
import { memo } from 'react';

export const BalanceCard = memo(({ balance, ethBalance }) => {
  return (
    <div className="balance-card">
      <div>Vault: {balance} ETH</div>
      <div>Wallet: {ethBalance} ETH</div>
    </div>
  );
});
```

**2. Lazy Loading:**
```javascript
import { lazy, Suspense } from 'react';

const Payroll = lazy(() => import('./components/Payroll'));
const LendingMarketplace = lazy(() => import('./components/LendingMarketplace'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Payroll />
      <LendingMarketplace />
    </Suspense>
  );
}
```

**3. Debouncing:**
```javascript
const debouncedSearch = useMemo(
  () =>
    debounce((value) => {
      searchUsers(value);
    }, 500),
  []
);
```

---

## Deployment Architecture

### Smart Contracts

**Deployment Process:**
```bash
# 1. Compile contracts
forge build

# 2. Test
forge test -vvv

# 3. Deploy to Sepolia
forge script script/DeployChainVaultCore.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast

# 4. Verify on Etherscan
forge verify-contract <CONTRACT_ADDRESS> \
  src/ChainVaultCore.sol:ChainVaultCore \
  --chain-id 11155111 \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

### Frontend Deployment

**Firebase Hosting:**
```bash
# 1. Build production bundle
npm run build

# 2. Deploy to Firebase
firebase deploy --only hosting

# 3. Deploy database rules
firebase deploy --only database
```

**Build Configuration:**
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'web3-vendor': ['ethers', 'wagmi', '@rainbow-me/rainbowkit'],
          'firebase-vendor': ['firebase/app', 'firebase/database']
        }
      }
    }
  }
});
```

---

## Monitoring & Maintenance

### Event Monitoring

**Smart Contract Events:**
```solidity
event Deposited(address indexed user, uint256 amount, uint256 balanceAfter, bytes32 ref);
event Withdrawn(address indexed user, address indexed to, uint256 amount, uint256 balanceAfter, bytes32 ref);
event Paid(address indexed from, address indexed to, uint256 amount, uint256 balanceAfter, bytes32 ref);
event Paused(address indexed by);
event Unpaused(address indexed by);
```

**Frontend Event Listeners:**
```javascript
contract.on("Deposited", (user, amount, balanceAfter, ref) => {
  console.log(`User ${user} deposited ${ethers.formatEther(amount)} ETH`);
  updateBalances();
});

contract.on("Paid", (from, to, amount, balanceAfter, ref) => {
  console.log(`Payment: ${from} → ${to}: ${ethers.formatEther(amount)} ETH`);
  updateBalances();
});
```

### Error Handling

**Global Error Boundary:**
```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh the page.</div>;
    }
    return this.props.children;
  }
}
```

---

## Scalability Considerations

### Current Limitations

1. **Single-Chain Deployment**: Currently on Sepolia testnet only
2. **On-Chain History**: Limited to 50 transactions per user
3. **Firebase Limitations**: Rate limits on database operations
4. **Gas Costs**: Ethereum mainnet gas fees can be high

### Future Enhancements

**1. Multi-Chain Support:**
- Deploy to Arbitrum, Optimism, Polygon
- Cross-chain bridge integration
- Unified balance across chains

**2. Layer 2 Integration:**
- Reduce gas costs significantly
- Faster transaction confirmation
- Better scalability

**3. State Channels:**
- Off-chain payment aggregation
- Single on-chain settlement
- Instant finality

**4. Decentralized Storage:**
- IPFS for document storage
- Arweave for permanent records
- Reduce Firebase dependency

---

## Development Workflow

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/ivocreates/chainvalut.git
cd chainvalut

# 2. Install dependencies
cd dapp
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your values

# 4. Start development server
npm run dev

# 5. Run tests
npm test
```

### Testing Strategy

**Smart Contract Tests:**
```solidity
// test/ChainVaultCore.t.sol
function testDeposit() public {
    vm.startPrank(user1);
    vault.deposit{value: 1 ether}(keccak256("test"));
    assertEq(vault.balanceOf(user1), 1 ether);
    vm.stopPrank();
}

function testWithdraw() public {
    // Setup
    vm.startPrank(user1);
    vault.deposit{value: 1 ether}(keccak256("deposit"));
    
    // Test
    vault.withdraw(0.5 ether, payable(user1), keccak256("withdraw"));
    assertEq(vault.balanceOf(user1), 0.5 ether);
    vm.stopPrank();
}
```

**Frontend Tests:**
```javascript
describe('ActionPanel', () => {
  it('should deposit ETH successfully', async () => {
    const { getByText, getByPlaceholderText } = render(
      <ActionPanel contract={mockContract} address="0x123..." />
    );
    
    const input = getByPlaceholderText('Amount in ETH');
    fireEvent.change(input, { target: { value: '1.0' } });
    
    const button = getByText('Deposit ETH');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockContract.deposit).toHaveBeenCalled();
    });
  });
});
```

---

## Technology Decisions

### Why React 19?

- **Performance**: Improved rendering engine
- **Concurrent Features**: Better UX during updates
- **Automatic Batching**: Fewer re-renders
- **Transitions API**: Smooth navigation

### Why Vite?

- **Fast HMR**: Instant updates during development
- **Optimized Builds**: Better production bundles
- **Native ESM**: Modern module system
- **Plugin Ecosystem**: Rich tooling support

### Why Firebase?

- **Real-time Sync**: Instant data updates
- **Simple Setup**: No backend coding required
- **Scalable**: Handles traffic spikes
- **Free Tier**: Generous limits for prototypes

### Why Foundry?

- **Fast Testing**: Rust-based, extremely fast
- **Solidity Scripts**: Deploy with Solidity
- **Fuzzing**: Advanced testing capabilities
- **No JavaScript**: Pure Solidity workflow

---

*Last Updated: October 26, 2025*
