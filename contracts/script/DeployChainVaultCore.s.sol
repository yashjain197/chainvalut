// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {HelperConfig} from "./HelperConfig.s.sol";
import {ChainVaultCore} from "../src/ChainVaultCore.sol";

contract DeployChainVaultCore is Script {
    function run()
        external
        returns (ChainVaultCore deployed, HelperConfig.NetworkConfig memory cfg)
    {
        HelperConfig helper = new HelperConfig();

        // Public getter returns a tuple, not the struct
        (address priceFeed, address linkToken, address automationRegistry, address automationRegistrar) =
            helper.activeNetworkConfig();

        // Rebuild the struct from the tuple
        cfg = HelperConfig.NetworkConfig({
            priceFeed: priceFeed,
            linkToken: linkToken,
            automationRegistry: automationRegistry,
            automationRegistrar: automationRegistrar
        });

        vm.startBroadcast();
        deployed = new ChainVaultCore(cfg.priceFeed);
        vm.stopBroadcast();
    }

    // No-broadcast path for tests/local harnesses
    function runWithConfig(HelperConfig.NetworkConfig memory cfg)
        external
        returns (ChainVaultCore deployed, HelperConfig.NetworkConfig memory used)
    {
        used = cfg;
        deployed = new ChainVaultCore(cfg.priceFeed);
    }
}
