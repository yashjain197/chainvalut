// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {ChainVaultCore} from "../src/ChainVaultCore.sol";
import {MockV3Aggregator} from "./mocks/MockV3Aggregator.sol";

// Import the deploy script and HelperConfig type for the struct
import {DeployChainVaultCore} from "../script/DeployChainVaultCore.s.sol";
import {HelperConfig} from "../script/HelperConfig.s.sol";

// OpenZeppelin v5 custom error selectors (for revert matching)
error EnforcedPause(); // Pausable.whenNotPaused()
error OwnableUnauthorizedAccount(address account); // Ownable.onlyOwner

contract ReentrantReceiver {
    ChainVaultCore public vault;
    address public attacker;

    constructor(ChainVaultCore _vault) {
        vault = _vault;
        attacker = msg.sender;
    }

    // Try to reenter on receipt; swallow failures to avoid bubbling revert
    receive() external payable {
        // attempt reentrancy: this should fail due to nonReentrant
        try vault.withdraw(1, payable(attacker), bytes32("reenter")) {
            // no-op, should not succeed
        } catch {
            // swallow
        }
    }

    function attackWithdraw(uint256 amount, bytes32 ref) external {
        // attacker must have internal balance
        vault.withdraw(amount, payable(address(this)), ref);
    }
}

contract ChainVaultCoreTest is Test {
    // Chainlink mock config (matches HelperConfig defaults)
    uint8 internal constant DECIMALS = 8;
    int256 internal constant INITIAL_PRICE = 2000e8;

    ChainVaultCore vault;
    MockV3Aggregator feed;

    address owner = makeAddr("Owner");
    address alice = makeAddr("Alice");
    address bob   = makeAddr("Bob");
    address eve   = makeAddr("Eve");

    function setUp() public {
        // 1) Deploy a local price feed mock
        feed = new MockV3Aggregator(DECIMALS, INITIAL_PRICE);

        // 2) Build a config struct compatible with HelperConfig.NetworkConfig
        HelperConfig.NetworkConfig memory cfg = HelperConfig.NetworkConfig({
            priceFeed: address(feed),
            linkToken: address(0),
            automationRegistry: address(0),
            automationRegistrar: address(0)
        });

        // 3) Use the deploy script (no-broadcast path) to deploy the vault locally
        DeployChainVaultCore deployer = new DeployChainVaultCore();
        (vault, ) = deployer.runWithConfig(cfg); // requires the helper function in the deploy script

        // Make the designated EOA the owner to match tests that call vm.prank(owner)
        vm.prank(address(deployer));
        vault.transferOwnership(owner);

        // Labels
        vm.label(owner, "Owner");
        vm.label(alice, "Alice");
        vm.label(bob,   "Bob");
        vm.label(eve,   "Eve");
        vm.label(address(vault), "ChainVaultCore");
    }

    // ============ Deposit ============

    function test_Deposit_IncreasesBalance_AndEmits() public {
        deal(alice, 10 ether);
        vm.prank(alice);

        bytes32 ref = keccak256("dep1");

        vm.expectEmit(true, true, true, true, address(vault));
        // event Deposited(address indexed user, uint256 amount, uint256 balanceAfter, bytes32 ref);
        emit Deposited(alice, 1 ether, 1 ether, ref);

        vault.deposit{value: 1 ether}(ref);

        assertEq(vault.balanceOf(alice), 1 ether, "balance");
        assertEq(vault.totalLiabilities(), 1 ether, "liabilities");
    }

    function test_Deposit_Revert_Zero() public {
        vm.prank(alice);
        vm.expectRevert(ChainVaultCore.ZeroAmount.selector);
        vault.deposit{value: 0}(bytes32("z"));
    }

    function test_DirectSend_Reverts_AndDoesNotAffectLedger() public {
        deal(alice, 1 ether);
        vm.prank(alice);
        (bool ok, ) = address(vault).call{value: 1 ether}("");
        assertFalse(ok, "direct send should fail");
        assertEq(vault.balanceOf(alice), 0);
        assertEq(vault.totalLiabilities(), 0);
    }

    // ============ Withdraw ============

    function test_Withdraw_ToSelf_HappyPath() public {
        deal(alice, 5 ether);
        vm.prank(alice);
        vault.deposit{value: 2 ether}(bytes32("d"));

        uint256 before = alice.balance;
        vm.prank(alice);

        bytes32 ref = keccak256("w1");
        vm.expectEmit(true, true, true, true, address(vault));
        emit Withdrawn(alice, alice, 1 ether, 1 ether, ref);

        vault.withdraw(1 ether, payable(alice), ref);

        assertEq(vault.balanceOf(alice), 1 ether);
        assertEq(vault.totalLiabilities(), 1 ether);
        assertEq(alice.balance, before - 0 ether + 1 ether);
    }

    function test_Withdraw_ToOtherEOA_HappyPath() public {
        deal(alice, 5 ether);
        vm.startPrank(alice);
        vault.deposit{value: 2 ether}(bytes32("d"));
        uint256 bobBefore = bob.balance;

        bytes32 ref = keccak256("w2");
        vm.expectEmit(true, true, true, true, address(vault));
        emit Withdrawn(alice, bob, 1 ether, 1 ether, ref);

        vault.withdraw(1 ether, payable(bob), ref);
        vm.stopPrank();

        assertEq(bob.balance, bobBefore + 1 ether);
        assertEq(vault.balanceOf(alice), 1 ether);
        assertEq(vault.totalLiabilities(), 1 ether);
    }

    function test_WithdrawAll() public {
        deal(alice, 3 ether);
        vm.prank(alice);
        vault.deposit{value: 3 ether}(bytes32("d"));

        uint256 before = alice.balance;
        vm.prank(alice);
        vault.withdrawAll(bytes32("all"));

        assertEq(vault.balanceOf(alice), 0);
        assertEq(vault.totalLiabilities(), 0);
        assertEq(alice.balance, before + 3 ether);
    }

    function test_Withdraw_Revert_InsufficientBalance() public {
        vm.prank(alice);
        vm.expectPartialRevert(ChainVaultCore.InsufficientBalance.selector);
        vault.withdraw(1 ether, payable(alice), bytes32("x"));
    }

    function test_Withdraw_Revert_ZeroAmount() public {
        vm.prank(alice);
        vm.expectRevert(ChainVaultCore.ZeroAmount.selector);
        vault.withdraw(0, payable(alice), bytes32("x"));
    }

    function test_Withdraw_Revert_InvalidAddress() public {
        deal(alice, 1 ether);
        vm.startPrank(alice);
        vault.deposit{value: 1 ether}(bytes32("d"));
        vm.expectRevert(ChainVaultCore.InvalidAddress.selector);
        vault.withdraw(1 ether, payable(address(0)), bytes32("x"));
        vm.stopPrank();
    }

    // ============ Pay (alias) ============

    function test_Pay_ToEOA_HappyPath() public {
        deal(alice, 4 ether);
        vm.startPrank(alice);
        vault.deposit{value: 2 ether}(bytes32("d"));
        uint256 bobBefore = bob.balance;

        bytes32 ref = keccak256("p1");
        vm.expectEmit(true, true, true, true, address(vault));
        emit Paid(alice, bob, 1 ether, 1 ether, ref);

        vault.pay(payable(bob), 1 ether, ref);
        vm.stopPrank();

        assertEq(bob.balance, bobBefore + 1 ether);
        assertEq(vault.balanceOf(alice), 1 ether);
        assertEq(vault.totalLiabilities(), 1 ether);
    }

    function test_Pay_Revert_ZeroAmount() public {
        vm.prank(alice);
        vm.expectRevert(ChainVaultCore.ZeroAmount.selector);
        vault.pay(payable(bob), 0, bytes32("x"));
    }

    function test_Pay_Revert_InvalidAddress() public {
        vm.prank(alice);
        vm.expectRevert(ChainVaultCore.InvalidAddress.selector);
        vault.pay(payable(address(0)), 1, bytes32("x"));
    }

    // ============ Pause & Ownership (OZ v5) ============

    function test_Pause_And_Unpause() public {
        vm.prank(owner);
        vault.pause();

        // Expect contract's custom PausedError() during whenNotPaused function
        deal(alice, 1 ether);
        vm.prank(alice);
        vm.expectRevert(ChainVaultCore.PausedError.selector);
        vault.deposit{value: 1 ether}(bytes32("p"));

        vm.prank(owner);
        vault.unpause();

        vm.prank(alice);
        vault.deposit{value: 1 ether}(bytes32("ok"));
        assertEq(vault.balanceOf(alice), 1 ether);
    }

    function test_OnlyOwner_Guards() public {
        // Non-owner calling pause() should revert with contract's custom NotOwner()
        vm.prank(alice);
        vm.expectRevert(ChainVaultCore.NotOwner.selector);
        vault.pause();

        // Owner can pause/unpause
        vm.prank(owner);
        vault.pause();

        // Non-owner calling unpause() should also revert with NotOwner()
        vm.prank(alice);
        vm.expectRevert(ChainVaultCore.NotOwner.selector);
        vault.unpause();

        vm.prank(owner);
        vault.unpause();
    }


    function test_TransferOwnership() public {
        vm.prank(owner);
        vault.transferOwnership(bob);
        vm.prank(bob);
        vault.pause();
    }

    // ============ History (ring buffer) ============

    function test_RecentHistory_Bounded_And_Ordered() public {
        uint256 N = 105;
        deal(alice, N * 1 ether);
        vm.startPrank(alice);
        for (uint256 i = 1; i <= N; i++) {
            vault.deposit{value: 1 ether}(bytes32(i));
        }
        vm.stopPrank();

        // Count increased
        assertEq(vault.userHistoryCount(alice), uint64(N));

        // Only last HISTORY_SIZE kept on-chain
        ChainVaultCore.TxRecord[] memory rec = vault.recentHistory(alice);
        assertEq(rec.length, vault.HISTORY_SIZE());

        // Oldest in buffer should be (N - HISTORY_SIZE + 1)
        uint256 first = N - vault.HISTORY_SIZE() + 1;
        assertEq(uint256(rec[0].amount), 1 ether);
        assertEq(uint256(rec[0].action), uint256(ChainVaultCore.Action.Deposit));
        assertEq(rec[0].from, alice);
        assertEq(rec[0].to, address(vault));
        assertEq(rec[0].ref, bytes32(first));

        // Last should be N
        uint256 last = N;
        uint256 lastIdx = rec.length - 1;
        assertEq(uint256(rec[lastIdx].amount), 1 ether);
        assertEq(uint256(rec[lastIdx].action), uint256(ChainVaultCore.Action.Deposit));
        assertEq(rec[lastIdx].from, alice);
        assertEq(rec[lastIdx].to, address(vault));
        assertEq(rec[lastIdx].ref, bytes32(last));
    }

    // ============ Reentrancy hardening ============

    function test_Reentrancy_OnWithdraw_FailsToDrain() public {
        // attacker prepares Eve's internal balance
        deal(alice, 10 ether);
        vm.prank(alice);
        vault.deposit{value: 5 ether}(bytes32("fund-attacker"));

        vm.prank(alice);
        vault.withdraw(5 ether, payable(eve), bytes32("to-eve"));

        vm.prank(eve);
        vault.deposit{value: 5 ether}(bytes32("attacker"));

        vm.prank(eve);
        ReentrantReceiver recv = new ReentrantReceiver(vault);

        // Withdraw to the receiver so its receive() tries to reenter and fails safely
        uint256 recvBefore = address(recv).balance;
        vm.prank(eve);
        vault.withdraw(2 ether, payable(address(recv)), bytes32("attack"));

        // Receiver got exactly 2 ether; Eve’s internal balance decreased by 2
        assertEq(address(recv).balance, recvBefore + 2 ether);
        assertEq(vault.balanceOf(eve), 3 ether);
        assertEq(address(vault).balance, vault.totalLiabilities());
    }

    // ============ Price Feed (read & update) ============

    function test_PriceFeed_ReadsAndUpdate() public {
        // initial read from constructor-provided feed
        (int256 answer, uint8 d) = vault.getLatestEthUsd();
        assertEq(answer, INITIAL_PRICE);
        assertEq(d, DECIMALS);

        // deploy a new feed with a different price, update via owner, and re-read
        vm.startPrank(owner);
        MockV3Aggregator newFeed = new MockV3Aggregator(DECIMALS, 2100e8);
        vault.setPriceFeed(address(newFeed));
        vm.stopPrank();

        (int256 answer2, uint8 d2) = vault.getLatestEthUsd();
        assertEq(answer2, 2100e8);
        assertEq(d2, DECIMALS);
    }

    // ============ Fuzz tests ============

    function testFuzz_Deposit_And_Withdraw(uint96 amt) public {
        uint256 amount = bound(uint256(amt), 1 wei, 1000 ether);
        deal(alice, amount);

        vm.prank(alice);
        vault.deposit{value: amount}(bytes32("fuzz"));

        assertEq(vault.balanceOf(alice), amount);
        assertEq(vault.totalLiabilities(), amount);

        vm.prank(alice);
        vault.withdraw(amount, payable(alice), bytes32("fuzz-out"));

        assertEq(vault.balanceOf(alice), 0);
        assertEq(vault.totalLiabilities(), 0);
    }

    // ============ Invariant: solvency ============

    function invariant_VaultSolvent() public view {
        // Contract ETH must always equal totalLiabilities
        assertEq(address(vault).balance, vault.totalLiabilities());
    }

    // ============ Events interface (for expectEmit) ============

    event Deposited(address indexed user, uint256 amount, uint256 balanceAfter, bytes32 ref);
    event Withdrawn(address indexed user, address indexed to, uint256 amount, uint256 balanceAfter, bytes32 ref);
    event Paid(address indexed from, address indexed to, uint256 amount, uint256 balanceAfter, bytes32 ref);
}
