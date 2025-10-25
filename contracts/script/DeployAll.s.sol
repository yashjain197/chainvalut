// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {HelperConfig} from "./HelperConfig.s.sol";
import {ChainVaultCore} from "../src/ChainVaultCore.sol";
import {NomineeVault} from "../src/NomineeVault.sol";

contract DeployAll is Script {
    function run() external {
        // Instantiate HelperConfig and unpack tuple into struct
        HelperConfig helper = new HelperConfig();
        (address priceFeed, address linkToken, address automationRegistry, address automationRegistrar) =
            helper.activeNetworkConfig();

        HelperConfig.NetworkConfig memory cfg = HelperConfig.NetworkConfig({
            priceFeed: priceFeed,
            linkToken: linkToken,
            automationRegistry: automationRegistry,
            automationRegistrar: automationRegistrar
        });

        console.log("Deploying contracts to chain ID:", block.chainid);
        console.log("Using price feed:", cfg.priceFeed);
        console.log("Deployment sender address:", msg.sender);

        vm.startBroadcast();

        // Deploy ChainVaultCore
        ChainVaultCore chainVault = new ChainVaultCore(cfg.priceFeed);
        console.log("ChainVaultCore deployed at:", address(chainVault));
        console.log("ChainVaultCore owner:", chainVault.owner());

        // Deploy NomineeVault
        NomineeVault nomineeVault = new NomineeVault(cfg.priceFeed);
        console.log("NomineeVault deployed at:", address(nomineeVault));
        console.log("NomineeVault owner:", nomineeVault.owner());
        console.log("NomineeVault inactivity period:", nomineeVault.inactivityPeriod(), "seconds");

        vm.stopBroadcast();
    }
}
