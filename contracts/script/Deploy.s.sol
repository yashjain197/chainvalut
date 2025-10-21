// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/NomineeVault.sol";

/**
 * @title Deploy
 * @notice Deployment script for NomineeVault contract
 * @dev Run with: forge script script/Deploy.s.sol:Deploy --rpc-url <RPC_URL> --broadcast --verify
 */
contract Deploy is Script {
    
    function run() external {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy NomineeVault
        NomineeVault nomineeVault = new NomineeVault();
        
        console.log("NomineeVault deployed at:", address(nomineeVault));
        console.log("Deployer (owner):", vm.addr(deployerPrivateKey));
        console.log("Default inactivity period:", nomineeVault.inactivityPeriod(), "seconds");
        
        vm.stopBroadcast();
    }
}

/**
 * @title DeployTestnet
 * @notice Deployment script with initial configuration for testnet
 */
contract DeployTestnet is Script {
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy contract
        NomineeVault nomineeVault = new NomineeVault();
        
        console.log("=== NomineeVault Deployment ===");
        console.log("Contract address:", address(nomineeVault));
        console.log("Owner:", deployer);
        console.log("Network:", block.chainid);
        
        // Optional: Set custom inactivity period for testing (e.g., 7 days)
        // Uncomment the following lines for faster testing
        // uint256 testInactivityPeriod = 7 days;
        // nomineeVault.setInactivityPeriod(testInactivityPeriod);
        // console.log("Inactivity period set to:", testInactivityPeriod, "seconds");
        
        console.log("=== Deployment Complete ===");
        
        vm.stopBroadcast();
    }
}
