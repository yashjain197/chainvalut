// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {MockV3Aggregator} from "../test/mocks/MockV3Aggregator.sol";

contract HelperConfig is Script {
    NetworkConfig public activeNetworkConfig;

    uint8 public constant DECIMALS = 8;
    int256 public constant INITIAL_PRICE = 2000e8; // $2,000 * 1e8

    struct NetworkConfig {
        address priceFeed;         // ETH/USD feed
        address linkToken;         // LINK token
        address automationRegistry;// Automation Registry (v2.1+)
        address automationRegistrar;// Automation Registrar (v2.1+)
    }

    constructor() {
        if (block.chainid == 11155111) { // Sepolia
            activeNetworkConfig = getSepoliaConfig();
        } else if (block.chainid == 1) { // Mainnet
            activeNetworkConfig = getMainnetConfig();
        } else {
            activeNetworkConfig = getOrCreateAnvilConfig();
        }
    }

    function getSepoliaConfig() public pure returns (NetworkConfig memory) {
        return NetworkConfig({
            priceFeed: 0x694AA1769357215DE4FAC081bf1f309aDC325306, // ETH/USD
            linkToken: 0x779877A7B0D9E8603169DdbD7836e478b4624789, // LINK
            automationRegistry: 0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad, // Registry v2.1
            automationRegistrar: 0xb0E49c5D0d05cbc241d68c05BC5BA1d1B7B72976 // Registrar v2.1
        });
    }

    function getMainnetConfig() public pure returns (NetworkConfig memory) {
        return NetworkConfig({
            priceFeed: 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419, // ETH/USD
            linkToken: 0x514910771AF9Ca656af840dff83E8264EcF986CA, // LINK
            automationRegistry: 0x6593c7De001fC8542bB1703532EE1E5aA0D458fD, // Registry v2.1
            automationRegistrar: 0x6B0B234fB2f380309D47A7E9391E29E9a179395a // Registrar v2.1
        });
    }

    function getOrCreateAnvilConfig() public returns (NetworkConfig memory) {
        if (activeNetworkConfig.priceFeed != address(0)) {
            return activeNetworkConfig;
        }
        // Local mock price feed. No real Automation locally.
        vm.startBroadcast();
        MockV3Aggregator mockPriceFeed = new MockV3Aggregator(DECIMALS, INITIAL_PRICE);
        vm.stopBroadcast();

        return NetworkConfig({
            priceFeed: address(mockPriceFeed),
            linkToken: address(0),            // no LINK locally
            automationRegistry: address(0),   // no registry locally
            automationRegistrar: address(0)   // no registrar locally
        });
    }
}
