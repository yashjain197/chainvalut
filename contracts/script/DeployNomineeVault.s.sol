// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {HelperConfig} from "./HelperConfig.s.sol";
import {NomineeVault} from "../src/NomineeVault.sol";

contract DeployNomineeVault is Script {
    function run()
        external
        returns (NomineeVault deployed, HelperConfig.NetworkConfig memory cfg)
    {
        HelperConfig helper = new HelperConfig();

        // Get network configuration
        (address priceFeed, address linkToken, address automationRegistry, address automationRegistrar) =
            helper.activeNetworkConfig();

        // Rebuild the struct from the tuple
        cfg = HelperConfig.NetworkConfig({
            priceFeed: priceFeed,
            linkToken: linkToken,
            automationRegistry: automationRegistry,
            automationRegistrar: automationRegistrar
        });

        console.log("Deploying NomineeVault to chain ID:", block.chainid);
        console.log("Using price feed:", cfg.priceFeed);
        console.log("Deployer address:", msg.sender);

        vm.startBroadcast();
        deployed = new NomineeVault(cfg.priceFeed);
        vm.stopBroadcast();

        console.log("=================================");
        console.log("NomineeVault deployed at:", address(deployed));
        console.log("Owner:", deployed.owner());
        console.log("Inactivity Period:", deployed.inactivityPeriod(), "seconds");
        console.log("=================================");
    }

    // No-broadcast path for tests/local harnesses
    function runWithConfig(HelperConfig.NetworkConfig memory cfg)
        external
        returns (NomineeVault deployed, HelperConfig.NetworkConfig memory used)
    {
        used = cfg;
        deployed = new NomineeVault(cfg.priceFeed);
    }
}
