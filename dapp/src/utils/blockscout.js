/**
 * Blockscout API Integration
 * https://docs.blockscout.com/
 */

// Blockscout API endpoints for different networks
const BLOCKSCOUT_ENDPOINTS = {
  1: 'https://eth.blockscout.com/api/v2', // Ethereum Mainnet
  11155111: 'https://eth-sepolia.blockscout.com/api/v2', // Sepolia Testnet
  10: 'https://optimism.blockscout.com/api/v2', // Optimism
  42161: 'https://arbitrum.blockscout.com/api/v2', // Arbitrum
  137: 'https://polygon.blockscout.com/api/v2', // Polygon
  8453: 'https://base.blockscout.com/api/v2', // Base
  56: 'https://bsc.blockscout.com/api/v2', // BSC
};

// Blockscout Explorer URLs
const BLOCKSCOUT_EXPLORER = {
  1: 'https://eth.blockscout.com',
  11155111: 'https://eth-sepolia.blockscout.com',
  10: 'https://optimism.blockscout.com',
  42161: 'https://arbitrum.blockscout.com',
  137: 'https://polygon.blockscout.com',
  8453: 'https://base.blockscout.com',
  56: 'https://bsc.blockscout.com',
};

/**
 * Get Blockscout API endpoint for a chain
 */
export function getBlockscoutAPI(chainId) {
  return BLOCKSCOUT_ENDPOINTS[chainId] || BLOCKSCOUT_ENDPOINTS[11155111];
}

/**
 * Get Blockscout Explorer URL for a chain
 */
export function getBlockscoutExplorer(chainId) {
  return BLOCKSCOUT_EXPLORER[chainId] || BLOCKSCOUT_EXPLORER[11155111];
}

/**
 * Get transaction details from Blockscout
 */
export async function getTransactionDetails(txHash, chainId = 11155111) {
  try {
    const apiUrl = getBlockscoutAPI(chainId);
    const response = await fetch(`${apiUrl}/transactions/${txHash}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data,
      explorerUrl: `${getBlockscoutExplorer(chainId)}/tx/${txHash}`
    };
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    return {
      success: false,
      error: error.message,
      explorerUrl: `${getBlockscoutExplorer(chainId)}/tx/${txHash}`
    };
  }
}

/**
 * Get address details from Blockscout
 */
export async function getAddressDetails(address, chainId = 11155111) {
  try {
    const apiUrl = getBlockscoutAPI(chainId);
    const response = await fetch(`${apiUrl}/addresses/${address}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data,
      explorerUrl: `${getBlockscoutExplorer(chainId)}/address/${address}`
    };
  } catch (error) {
    console.error('Error fetching address details:', error);
    return {
      success: false,
      error: error.message,
      explorerUrl: `${getBlockscoutExplorer(chainId)}/address/${address}`
    };
  }
}

/**
 * Get transactions for an address from Blockscout
 */
export async function getAddressTransactions(address, chainId = 11155111) {
  try {
    const apiUrl = getBlockscoutAPI(chainId);
    const response = await fetch(`${apiUrl}/addresses/${address}/transactions`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      transactions: data.items || [],
      nextPage: data.next_page_params
    };
  } catch (error) {
    console.error('Error fetching address transactions:', error);
    return {
      success: false,
      error: error.message,
      transactions: []
    };
  }
}

/**
 * Get token transfers for an address from Blockscout
 */
export async function getTokenTransfers(address, chainId = 11155111) {
  try {
    const apiUrl = getBlockscoutAPI(chainId);
    const response = await fetch(`${apiUrl}/addresses/${address}/token-transfers`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      transfers: data.items || [],
      nextPage: data.next_page_params
    };
  } catch (error) {
    console.error('Error fetching token transfers:', error);
    return {
      success: false,
      error: error.message,
      transfers: []
    };
  }
}

/**
 * Get stats for the chain from Blockscout
 */
export async function getChainStats(chainId = 11155111) {
  try {
    const apiUrl = getBlockscoutAPI(chainId);
    const response = await fetch(`${apiUrl}/stats`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      stats: data
    };
  } catch (error) {
    console.error('Error fetching chain stats:', error);
    return {
      success: false,
      error: error.message,
      stats: null
    };
  }
}

/**
 * Format transaction value for display
 */
export function formatTransactionValue(value, decimals = 18) {
  if (!value) return '0';
  const num = parseFloat(value) / Math.pow(10, decimals);
  return num.toFixed(6);
}

/**
 * Format timestamp to readable date
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Get transaction status badge
 */
export function getTransactionStatus(tx) {
  if (!tx) return { text: 'Unknown', color: 'gray' };
  
  if (tx.status === 'ok' || tx.result === 'success') {
    return { text: 'Success', color: 'green' };
  } else if (tx.status === 'error' || tx.result === 'error') {
    return { text: 'Failed', color: 'red' };
  } else if (tx.status === 'pending') {
    return { text: 'Pending', color: 'yellow' };
  }
  
  return { text: 'Unknown', color: 'gray' };
}

/**
 * Build Blockscout explorer link
 */
export function buildExplorerLink(type, value, chainId = 11155111) {
  const explorer = getBlockscoutExplorer(chainId);
  
  switch (type) {
    case 'tx':
    case 'transaction':
      return `${explorer}/tx/${value}`;
    case 'address':
    case 'account':
      return `${explorer}/address/${value}`;
    case 'block':
      return `${explorer}/block/${value}`;
    case 'token':
      return `${explorer}/token/${value}`;
    default:
      return explorer;
  }
}

/**
 * Search on Blockscout
 */
export async function searchBlockscout(query, chainId = 11155111) {
  try {
    const apiUrl = getBlockscoutAPI(chainId);
    const response = await fetch(`${apiUrl}/search?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      results: data.items || []
    };
  } catch (error) {
    console.error('Error searching Blockscout:', error);
    return {
      success: false,
      error: error.message,
      results: []
    };
  }
}
