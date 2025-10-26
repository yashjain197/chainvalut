// ChainVault Contract Configuration
// Updated with deployed addresses and full ABIs

export const CHAINVAULT_CORE_ADDRESS = '0xD4b6dA7689a0f392Dec8Ca3959E5f67e95abd2A7';
export const NOMINEE_VAULT_ADDRESS = '0xE6f6139929D658d31c5301F02bD8F5cE0b12Ffa4';
export const SEPOLIA_CHAIN_ID = 11155111;

// Use NomineeVault by default (has all features)
export const CONTRACT_ADDRESS = NOMINEE_VAULT_ADDRESS;

// ChainVaultCore ABI - Basic vault with payroll
export const CHAINVAULT_CORE_ABI = [
  {
    "type": "constructor",
    "inputs": [{"name": "priceFeed_", "type": "address", "internalType": "address"}],
    "stateMutability": "nonpayable"
  },
  {"type": "fallback", "stateMutability": "payable"},
  {"type": "receive", "stateMutability": "payable"},
  {
    "type": "function",
    "name": "HISTORY_SIZE",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint32", "internalType": "uint32"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "addPayrollRecipient",
    "inputs": [
      {"name": "wallet", "type": "address", "internalType": "address"},
      {"name": "amount", "type": "uint256", "internalType": "uint256"},
      {"name": "name", "type": "string", "internalType": "string"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "addPayrollRecipients",
    "inputs": [
      {"name": "wallets", "type": "address[]", "internalType": "address[]"},
      {"name": "amounts", "type": "uint256[]", "internalType": "uint256[]"},
      {"name": "names", "type": "string[]", "internalType": "string[]"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [{"name": "user", "type": "address", "internalType": "address"}],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "deposit",
    "inputs": [{"name": "ref", "type": "bytes32", "internalType": "bytes32"}],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "getLatestEthUsd",
    "inputs": [],
    "outputs": [
      {"name": "answer", "type": "int256", "internalType": "int256"},
      {"name": "feedDecimals", "type": "uint8", "internalType": "uint8"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPayrollRecipients",
    "inputs": [],
    "outputs": [{
      "name": "",
      "type": "tuple[]",
      "internalType": "struct ChainVaultCore.PayrollRecipient[]",
      "components": [
        {"name": "wallet", "type": "address", "internalType": "address"},
        {"name": "amount", "type": "uint256", "internalType": "uint256"},
        {"name": "name", "type": "string", "internalType": "string"}
      ]
    }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "pay",
    "inputs": [
      {"name": "to", "type": "address", "internalType": "address payable"},
      {"name": "amount", "type": "uint256", "internalType": "uint256"},
      {"name": "ref", "type": "bytes32", "internalType": "bytes32"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "payAllPayroll",
    "inputs": [{"name": "ref", "type": "bytes32", "internalType": "bytes32"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "payrollRecipientCount",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "removePayrollRecipient",
    "inputs": [{"name": "wallet", "type": "address", "internalType": "address"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "recentHistory",
    "inputs": [{"name": "user", "type": "address", "internalType": "address"}],
    "outputs": [{
      "name": "out",
      "type": "tuple[]",
      "internalType": "struct ChainVaultCore.TxRecord[]",
      "components": [
        {"name": "timestamp", "type": "uint64", "internalType": "uint64"},
        {"name": "from", "type": "address", "internalType": "address"},
        {"name": "to", "type": "address", "internalType": "address"},
        {"name": "action", "type": "uint8", "internalType": "enum ChainVaultCore.Action"},
        {"name": "amount", "type": "uint256", "internalType": "uint256"},
        {"name": "balanceAfter", "type": "uint256", "internalType": "uint256"},
        {"name": "ref", "type": "bytes32", "internalType": "bytes32"}
      ]
    }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "withdraw",
    "inputs": [
      {"name": "amount", "type": "uint256", "internalType": "uint256"},
      {"name": "to", "type": "address", "internalType": "address payable"},
      {"name": "ref", "type": "bytes32", "internalType": "bytes32"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "withdrawAll",
    "inputs": [{"name": "ref", "type": "bytes32", "internalType": "bytes32"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "PayrollRecipientAdded",
    "inputs": [
      {"name": "wallet", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256"},
      {"name": "name", "type": "string", "indexed": false, "internalType": "string"}
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PayrollRecipientRemoved",
    "inputs": [
      {"name": "wallet", "type": "address", "indexed": true, "internalType": "address"}
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PayrollPaid",
    "inputs": [
      {"name": "admin", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "count", "type": "uint256", "indexed": false, "internalType": "uint256"},
      {"name": "totalAmount", "type": "uint256", "indexed": false, "internalType": "uint256"}
    ],
    "anonymous": false
  }
];

// NomineeVault ABI - Full features (extends ChainVaultCore)
export const NOMINEE_VAULT_ABI = [
  {
    "type": "constructor",
    "inputs": [{"name": "priceFeed_", "type": "address", "internalType": "address"}],
    "stateMutability": "nonpayable"
  },
  {"type": "fallback", "stateMutability": "payable"},
  {"type": "receive", "stateMutability": "payable"},
  {
    "type": "function",
    "name": "HISTORY_SIZE",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint32", "internalType": "uint32"}],
    "stateMutability": "view"
  },
  // Payroll functions
  {
    "type": "function",
    "name": "addPayrollRecipient",
    "inputs": [
      {"name": "wallet", "type": "address", "internalType": "address"},
      {"name": "amount", "type": "uint256", "internalType": "uint256"},
      {"name": "name", "type": "string", "internalType": "string"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "addPayrollRecipients",
    "inputs": [
      {"name": "wallets", "type": "address[]", "internalType": "address[]"},
      {"name": "amounts", "type": "uint256[]", "internalType": "uint256[]"},
      {"name": "names", "type": "string[]", "internalType": "string[]"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getPayrollRecipients",
    "inputs": [],
    "outputs": [{
      "name": "",
      "type": "tuple[]",
      "internalType": "struct ChainVaultCore.PayrollRecipient[]",
      "components": [
        {"name": "wallet", "type": "address", "internalType": "address"},
        {"name": "amount", "type": "uint256", "internalType": "uint256"},
        {"name": "name", "type": "string", "internalType": "string"}
      ]
    }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "payAllPayroll",
    "inputs": [{"name": "ref", "type": "bytes32", "internalType": "bytes32"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "removePayrollRecipient",
    "inputs": [{"name": "wallet", "type": "address", "internalType": "address"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "payrollRecipientCount",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  // Nominee functions
  {
    "type": "function",
    "name": "setNominees",
    "inputs": [
      {"name": "encryptedData", "type": "bytes", "internalType": "bytes"},
      {"name": "nomineeAddresses", "type": "address[]", "internalType": "address[]"},
      {"name": "shares", "type": "uint256[]", "internalType": "uint256[]"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateNominees",
    "inputs": [
      {"name": "encryptedData", "type": "bytes", "internalType": "bytes"},
      {"name": "nomineeAddresses", "type": "address[]", "internalType": "address[]"},
      {"name": "shares", "type": "uint256[]", "internalType": "uint256[]"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "removeNominees",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getNomineeConfig",
    "inputs": [{"name": "user", "type": "address", "internalType": "address"}],
    "outputs": [{
      "name": "",
      "type": "tuple",
      "internalType": "struct NomineeVault.NomineeData",
      "components": [
        {"name": "encryptedData", "type": "bytes", "internalType": "bytes"},
        {"name": "totalShares", "type": "uint256", "internalType": "uint256"},
        {"name": "nomineeCount", "type": "uint256", "internalType": "uint256"},
        {"name": "claimedAmount", "type": "uint256", "internalType": "uint256"},
        {"name": "balanceSnapshot", "type": "uint256", "internalType": "uint256"},
        {"name": "isActive", "type": "bool", "internalType": "bool"}
      ]
    }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getNomineeShare",
    "inputs": [
      {"name": "user", "type": "address", "internalType": "address"},
      {"name": "nomineeIndex", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "claimNomineeShare",
    "inputs": [
      {"name": "user", "type": "address", "internalType": "address"},
      {"name": "nomineeIndex", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "isShareClaimed",
    "inputs": [
      {"name": "user", "type": "address", "internalType": "address"},
      {"name": "nomineeIndex", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [{"name": "", "type": "bool", "internalType": "bool"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isUserInactive",
    "inputs": [{"name": "user", "type": "address", "internalType": "address"}],
    "outputs": [{"name": "", "type": "bool", "internalType": "bool"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "lastActivity",
    "inputs": [{"name": "", "type": "address", "internalType": "address"}],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "timeUntilInactive",
    "inputs": [{"name": "user", "type": "address", "internalType": "address"}],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "inactivityPeriod",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "setInactivityPeriod",
    "inputs": [{"name": "newPeriod", "type": "uint256", "internalType": "uint256"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "pingActivity",
    "inputs": [{"name": "ref", "type": "bytes32", "internalType": "bytes32"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  // Core vault functions
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [{"name": "user", "type": "address", "internalType": "address"}],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "deposit",
    "inputs": [{"name": "ref", "type": "bytes32", "internalType": "bytes32"}],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "pay",
    "inputs": [
      {"name": "to", "type": "address", "internalType": "address payable"},
      {"name": "amount", "type": "uint256", "internalType": "uint256"},
      {"name": "ref", "type": "bytes32", "internalType": "bytes32"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "withdraw",
    "inputs": [
      {"name": "amount", "type": "uint256", "internalType": "uint256"},
      {"name": "to", "type": "address", "internalType": "address payable"},
      {"name": "ref", "type": "bytes32", "internalType": "bytes32"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "withdrawAll",
    "inputs": [{"name": "ref", "type": "bytes32", "internalType": "bytes32"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getLatestEthUsd",
    "inputs": [],
    "outputs": [
      {"name": "answer", "type": "int256", "internalType": "int256"},
      {"name": "feedDecimals", "type": "uint8", "internalType": "uint8"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "recentHistory",
    "inputs": [{"name": "user", "type": "address", "internalType": "address"}],
    "outputs": [{
      "name": "out",
      "type": "tuple[]",
      "internalType": "struct ChainVaultCore.TxRecord[]",
      "components": [
        {"name": "timestamp", "type": "uint64", "internalType": "uint64"},
        {"name": "from", "type": "address", "internalType": "address"},
        {"name": "to", "type": "address", "internalType": "address"},
        {"name": "action", "type": "uint8", "internalType": "enum ChainVaultCore.Action"},
        {"name": "amount", "type": "uint256", "internalType": "uint256"},
        {"name": "balanceAfter", "type": "uint256", "internalType": "uint256"},
        {"name": "ref", "type": "bytes32", "internalType": "bytes32"}
      ]
    }],
    "stateMutability": "view"
  },
  // Events
  {
    "type": "event",
    "name": "PayrollRecipientAdded",
    "inputs": [
      {"name": "wallet", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256"},
      {"name": "name", "type": "string", "indexed": false, "internalType": "string"}
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PayrollPaid",
    "inputs": [
      {"name": "admin", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "count", "type": "uint256", "indexed": false, "internalType": "uint256"},
      {"name": "totalAmount", "type": "uint256", "indexed": false, "internalType": "uint256"}
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "NomineesSet",
    "inputs": [
      {"name": "user", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "encryptedData", "type": "bytes", "indexed": false, "internalType": "bytes"},
      {"name": "nomineeCount", "type": "uint256", "indexed": false, "internalType": "uint256"},
      {"name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256"}
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "NomineeClaimed",
    "inputs": [
      {"name": "user", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "nominee", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256"},
      {"name": "sharePercentage", "type": "uint256", "indexed": false, "internalType": "uint256"},
      {"name": "nomineeIndex", "type": "uint256", "indexed": false, "internalType": "uint256"},
      {"name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256"}
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ActivityPinged",
    "inputs": [
      {"name": "user", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256"}
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "InactivityPeriodUpdated",
    "inputs": [
      {"name": "oldPeriod", "type": "uint256", "indexed": false, "internalType": "uint256"},
      {"name": "newPeriod", "type": "uint256", "indexed": false, "internalType": "uint256"},
      {"name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256"}
    ],
    "anonymous": false
  }
];

// Export default to NomineeVault ABI (most complete)
export const CONTRACT_ABI = NOMINEE_VAULT_ABI;

export const COLORS = {
  background: '#0B0E11',
  primaryAccent: '#1A73E8',
  secondaryAccent: '#00E0FF',
  highlight: '#4FC3F7',
  textPrimary: '#E8EAED',
  textSecondary: '#9AA0A6',
  success: '#00C853',
};
