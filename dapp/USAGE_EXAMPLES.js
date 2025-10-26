// Example: Complete Nominee Setup and Claim Flow
// This file demonstrates the full lifecycle of the NomineeVault system

import { ethers } from 'ethers';
import NomineeVaultABI from './src/contracts/NomineeVault.json';
import {
  initLitClient,
  setupNominees,
  claimNomineeShare,
  checkInactivityStatus,
} from './src/lib/litProtocol';

const NOMINEE_VAULT_ADDRESS = '0x4Bb25877b98782B0c15CE79119c37a7ea84A986f'; // Update after deployment

// ==================== EXAMPLE 1: User Sets Up Nominees ====================

async function exampleSetupNominees() {
  console.log('📋 Example 1: Setting Up Nominees\n');
  
  // Connect to MetaMask
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  const signer = provider.getSigner();
  const userAddress = await signer.getAddress();
  
  console.log('👤 User:', userAddress);
  
  // Initialize Lit Protocol
  console.log('🔐 Initializing Lit Protocol...');
  const litClient = await initLitClient();
  
  // Initialize contract
  const contract = new ethers.Contract(
    NOMINEE_VAULT_ADDRESS,
    NomineeVaultABI.abi,
    signer
  );
  
  // Define nominees (e.g., family members)
  const nomineeAddresses = [
    '0xAliceAddress...', // Wife - 50%
    '0xBobAddress...',   // Son - 30%
    '0xCarolAddress...'  // Daughter - 20%
  ];
  
  const shares = [50, 30, 20]; // Must sum to 100
  
  console.log('👨‍👩‍👧‍👦 Nominees:');
  nomineeAddresses.forEach((addr, idx) => {
    console.log(`  ${idx + 1}. ${addr} - ${shares[idx]}%`);
  });
  
  // Setup nominees (encrypts and stores on-chain)
  console.log('\n🔒 Encrypting nominee data with Lit Protocol...');
  const { receipt, metadata } = await setupNominees({
    nomineeAddresses,
    shares,
    contract,
    signer,
    litClient,
  });
  
  console.log('✅ Nominees set successfully!');
  console.log('📝 Transaction Hash:', receipt.transactionHash);
  console.log('⛽ Gas Used:', receipt.gasUsed.toString());
  
  // Store metadata securely (in production, use encrypted backend)
  localStorage.setItem(
    `nominee_metadata_${userAddress}`,
    JSON.stringify(metadata)
  );
  console.log('💾 Encryption metadata saved\n');
  
  // Deposit some ETH into vault
  console.log('💰 Depositing 10 ETH into vault...');
  const depositTx = await contract.deposit(
    ethers.utils.formatBytes32String('INITIAL_DEPOSIT'),
    { value: ethers.utils.parseEther('10') }
  );
  await depositTx.wait();
  
  const balance = await contract.balanceOf(userAddress);
  console.log('✅ Balance:', ethers.utils.formatEther(balance), 'ETH\n');
  
  console.log('👍 Setup Complete! Your nominees can claim after 365 days of inactivity.\n');
}

// ==================== EXAMPLE 2: Check Inactivity Status ====================

async function exampleCheckInactivity(userAddress) {
  console.log('📋 Example 2: Checking Inactivity Status\n');
  
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  const signer = provider.getSigner();
  
  const contract = new ethers.Contract(
    NOMINEE_VAULT_ADDRESS,
    NomineeVaultABI.abi,
    signer
  );
  
  console.log('🔍 Checking status for:', userAddress);
  
  const status = await checkInactivityStatus(userAddress, contract);
  
  console.log('📊 Status:');
  console.log('  Inactive:', status.isInactive ? '🔴 YES' : '🟢 NO');
  
  if (!status.isInactive) {
    const days = Math.floor(status.timeUntilInactive / 86400);
    const hours = Math.floor((status.timeUntilInactive % 86400) / 3600);
    console.log(`  Time Until Inactive: ${days} days, ${hours} hours`);
  } else {
    console.log('  Last Activity:', new Date(status.lastActivity * 1000).toLocaleString());
    console.log('  ✅ Nominees can claim now!');
  }
  
  const balance = await contract.balanceOf(userAddress);
  console.log('  Balance:', ethers.utils.formatEther(balance), 'ETH\n');
}

// ==================== EXAMPLE 3: User Pings Activity ====================

async function examplePingActivity() {
  console.log('📋 Example 3: Pinging Activity\n');
  
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  const signer = provider.getSigner();
  const userAddress = await signer.getAddress();
  
  const contract = new ethers.Contract(
    NOMINEE_VAULT_ADDRESS,
    NomineeVaultABI.abi,
    signer
  );
  
  console.log('👋 Pinging activity for:', userAddress);
  
  const tx = await contract.pingActivity(
    ethers.utils.formatBytes32String('STILL_ALIVE')
  );
  const receipt = await tx.wait();
  
  console.log('✅ Activity pinged!');
  console.log('📝 Transaction Hash:', receipt.transactionHash);
  console.log('⏰ New Last Activity:', new Date().toLocaleString());
  console.log('🔄 Inactivity timer reset to 365 days\n');
}

// ==================== EXAMPLE 4: Nominee Claims Share ====================

async function exampleClaimShare(inactiveUserAddress, nomineeIndex) {
  console.log('📋 Example 4: Nominee Claiming Share\n');
  
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  const signer = provider.getSigner();
  const nomineeAddress = await signer.getAddress();
  
  console.log('👤 Nominee:', nomineeAddress);
  console.log('🎯 Inactive User:', inactiveUserAddress);
  console.log('🔢 Nominee Index:', nomineeIndex);
  
  // Initialize Lit Protocol
  console.log('\n🔐 Initializing Lit Protocol...');
  const litClient = await initLitClient();
  
  const contract = new ethers.Contract(
    NOMINEE_VAULT_ADDRESS,
    NomineeVaultABI.abi,
    signer
  );
  
  // Retrieve encryption metadata
  const metadataStr = localStorage.getItem(`nominee_metadata_${inactiveUserAddress}`);
  if (!metadataStr) {
    throw new Error('No encryption metadata found. User may not have set up nominees.');
  }
  const metadata = JSON.parse(metadataStr);
  
  console.log('🔓 Decrypting nominee data...');
  
  // Claim share (automatically decrypts via Lit)
  const { receipt, claimAmount, sharePercentage } = await claimNomineeShare({
    inactiveUserAddress,
    nomineeIndex,
    metadata,
    contract,
    signer,
    litClient,
  });
  
  console.log('\n✅ Claim Successful!');
  console.log('💰 Claimed Amount:', claimAmount, 'ETH');
  console.log('📊 Share Percentage:', sharePercentage + '%');
  console.log('📝 Transaction Hash:', receipt.transactionHash);
  console.log('⛽ Gas Used:', receipt.gasUsed.toString());
  
  const newBalance = nomineeAddress.balance;
  console.log('\n💼 Your New Balance:', ethers.utils.formatEther(newBalance), 'ETH\n');
}

// ==================== EXAMPLE 5: Multiple Nominees Claim ====================

async function exampleMultipleClaims(inactiveUserAddress) {
  console.log('📋 Example 5: Multiple Nominees Claiming\n');
  
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  const signer = provider.getSigner();
  
  const contract = new ethers.Contract(
    NOMINEE_VAULT_ADDRESS,
    NomineeVaultABI.abi,
    signer
  );
  
  const config = await contract.getNomineeConfig(inactiveUserAddress);
  console.log('👥 Number of Nominees:', config.nomineeCount.toString());
  
  const litClient = await initLitClient();
  const metadataStr = localStorage.getItem(`nominee_metadata_${inactiveUserAddress}`);
  const metadata = JSON.parse(metadataStr);
  
  console.log('\n🔄 Claiming all shares...\n');
  
  for (let i = 0; i < config.nomineeCount; i++) {
    const isClaimed = await contract.isShareClaimed(inactiveUserAddress, i);
    
    if (!isClaimed) {
      console.log(`📦 Claiming share #${i}...`);
      
      try {
        const { claimAmount, sharePercentage } = await claimNomineeShare({
          inactiveUserAddress,
          nomineeIndex: i,
          metadata,
          contract,
          signer,
          litClient,
        });
        
        console.log(`  ✅ Claimed ${claimAmount} ETH (${sharePercentage}%)`);
      } catch (error) {
        console.log(`  ❌ Failed: ${error.message}`);
      }
    } else {
      console.log(`  ⏭️  Share #${i} already claimed`);
    }
  }
  
  const remainingBalance = await contract.balanceOf(inactiveUserAddress);
  console.log('\n💼 Remaining User Balance:', ethers.utils.formatEther(remainingBalance), 'ETH');
  console.log('✅ All claims processed!\n');
}

// ==================== EXAMPLE 6: Update Nominees ====================

async function exampleUpdateNominees() {
  console.log('📋 Example 6: Updating Nominees\n');
  
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  const signer = provider.getSigner();
  const userAddress = await signer.getAddress();
  
  const litClient = await initLitClient();
  
  const contract = new ethers.Contract(
    NOMINEE_VAULT_ADDRESS,
    NomineeVaultABI.abi,
    signer
  );
  
  // New nominees (e.g., added a grandchild)
  const newNomineeAddresses = [
    '0xAliceAddress...',  // Wife - 40%
    '0xBobAddress...',    // Son - 30%
    '0xCarolAddress...',  // Daughter - 20%
    '0xDaveAddress...'    // Grandchild - 10%
  ];
  
  const newShares = [40, 30, 20, 10];
  
  console.log('🔄 Updating to new nominees:');
  newNomineeAddresses.forEach((addr, idx) => {
    console.log(`  ${idx + 1}. ${addr} - ${newShares[idx]}%`);
  });
  
  // Encrypt new data
  const { encryptedData, ciphertext, dataToEncryptHash, accessControlConditions } =
    await encryptNomineeData({
      nomineeAddresses: newNomineeAddresses,
      shares: newShares,
      userAddress,
      signer,
      litClient,
    });
  
  // Update on-chain
  console.log('\n📝 Updating nominees on-chain...');
  const tx = await contract.updateNominees(
    encryptedData,
    newNomineeAddresses,
    newShares
  );
  const receipt = await tx.wait();
  
  console.log('✅ Nominees updated!');
  console.log('📝 Transaction Hash:', receipt.transactionHash);
  
  // Update metadata
  const newMetadata = {
    ciphertext,
    dataToEncryptHash,
    accessControlConditions,
    userAddress,
    nomineeCount: newNomineeAddresses.length,
    timestamp: Date.now(),
  };
  
  localStorage.setItem(`nominee_metadata_${userAddress}`, JSON.stringify(newMetadata));
  console.log('💾 New metadata saved\n');
}

// ==================== Export Examples ====================

export {
  exampleSetupNominees,
  exampleCheckInactivity,
  examplePingActivity,
  exampleClaimShare,
  exampleMultipleClaims,
  exampleUpdateNominees,
};

// ==================== Run Example ====================

// Uncomment to run in browser console:
// (async () => {
//   await exampleSetupNominees();
// })();
