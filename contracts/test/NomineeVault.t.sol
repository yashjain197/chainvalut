// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/NomineeVault.sol";

/**
 * @title NomineeVaultTest
 * @notice Comprehensive test suite for NomineeVault contract
 */
contract NomineeVaultTest is Test {
    
    NomineeVault public vault;
    
    address public owner;
    address public user1;
    address public user2;
    address public nominee1;
    address public nominee2;
    address public nominee3;
    
    bytes32 public constant TEST_REF = keccak256("TEST_REF");
    
    event NomineesSet(address indexed user, bytes encryptedData, uint256 nomineeCount, uint256 timestamp);
    event NomineeClaimed(address indexed user, address indexed nominee, uint256 amount, uint256 sharePercentage, uint256 nomineeIndex, uint256 timestamp);
    event ActivityPinged(address indexed user, uint256 timestamp);
    
    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        nominee1 = makeAddr("nominee1");
        nominee2 = makeAddr("nominee2");
        nominee3 = makeAddr("nominee3");
        
        vault = new NomineeVault(address(0)); // No price feed for tests
        
        // Fund test accounts
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
    }
    
    // ==================== Basic Functionality Tests ====================
    
    function test_Deployment() public view {
        assertEq(vault.owner(), owner);
        assertEq(vault.inactivityPeriod(), 365 days);
        assertEq(vault.claimsPaused(), false);
    }
    
    function test_DepositTracksActivity() public {
        vm.startPrank(user1);
        
        uint256 activityBefore = vault.lastActivity(user1);
        assertEq(activityBefore, 0);
        
        vault.deposit{value: 1 ether}(TEST_REF);
        
        uint256 activityAfter = vault.lastActivity(user1);
        assertEq(activityAfter, block.timestamp);
        assertEq(vault.balanceOf(user1), 1 ether);
        
        vm.stopPrank();
    }
    
    function test_WithdrawTracksActivity() public {
        vm.startPrank(user1);
        
        vault.deposit{value: 1 ether}(TEST_REF);
        
        vm.warp(block.timestamp + 1000);
        
        vault.withdraw(0.5 ether, payable(user1), TEST_REF);
        
        assertEq(vault.lastActivity(user1), block.timestamp);
        assertEq(vault.balanceOf(user1), 0.5 ether);
        
        vm.stopPrank();
    }
    
    function test_PayTracksActivity() public {
        vm.startPrank(user1);
        
        vault.deposit{value: 1 ether}(TEST_REF);
        
        uint256 user2BalanceBefore = user2.balance;
        vault.pay(payable(user2), 0.5 ether, TEST_REF);
        
        assertEq(vault.lastActivity(user1), block.timestamp);
        assertEq(vault.balanceOf(user1), 0.5 ether);
        assertEq(user2.balance, user2BalanceBefore + 0.5 ether); // user2's wallet balance, not vault balance
        
        vm.stopPrank();
    }
    
    // ==================== Nominee Setup Tests ====================
    
    function test_SetNomineesSuccess() public {
        vm.startPrank(user1);
        vault.deposit{value: 10 ether}(TEST_REF);
        
        address[] memory nominees = new address[](2);
        nominees[0] = nominee1;
        nominees[1] = nominee2;
        
        uint256[] memory shares = new uint256[](2);
        shares[0] = 60;
        shares[1] = 40;
        
        bytes memory encryptedData = abi.encode(nominees, shares);
        
        vm.expectEmit(true, false, false, true);
        emit NomineesSet(user1, encryptedData, 2, block.timestamp);
        
        vault.setNominees(encryptedData, nominees, shares);
        
        NomineeVault.NomineeData memory config = vault.getNomineeConfig(user1);
        assertEq(config.isActive, true);
        assertEq(config.nomineeCount, 2);
        assertEq(config.totalShares, 100);
        assertEq(config.claimedAmount, 0);
        
        vm.stopPrank();
    }
    
    function test_SetNomineesFailsInvalidShares() public {
        vm.startPrank(user1);
        vault.deposit{value: 10 ether}(TEST_REF);
        
        address[] memory nominees = new address[](2);
        nominees[0] = nominee1;
        nominees[1] = nominee2;
        
        uint256[] memory shares = new uint256[](2);
        shares[0] = 50; // Only sums to 90
        shares[1] = 40;
        
        bytes memory encryptedData = abi.encode(nominees, shares);
        
        vm.expectRevert(abi.encodeWithSelector(NomineeVault.InvalidShares.selector, 90));
        vault.setNominees(encryptedData, nominees, shares);
        
        vm.stopPrank();
    }
    
    function test_SetNomineesFailsSelfNomination() public {
        vm.startPrank(user1);
        vault.deposit{value: 10 ether}(TEST_REF);
        
        address[] memory nominees = new address[](2);
        nominees[0] = user1; // Self-nomination
        nominees[1] = nominee2;
        
        uint256[] memory shares = new uint256[](2);
        shares[0] = 60;
        shares[1] = 40;
        
        bytes memory encryptedData = abi.encode(nominees, shares);
        
        vm.expectRevert(NomineeVault.SelfNomination.selector);
        vault.setNominees(encryptedData, nominees, shares);
        
        vm.stopPrank();
    }
    
    function test_SetNomineesFailsArrayLengthMismatch() public {
        vm.startPrank(user1);
        vault.deposit{value: 10 ether}(TEST_REF);
        
        address[] memory nominees = new address[](2);
        nominees[0] = nominee1;
        nominees[1] = nominee2;
        
        uint256[] memory shares = new uint256[](3); // Mismatched length
        shares[0] = 33;
        shares[1] = 33;
        shares[2] = 34;
        
        bytes memory encryptedData = abi.encode(nominees, shares);
        
        vm.expectRevert(abi.encodeWithSelector(NomineeVault.NomineeCountMismatch.selector, 2, 3));
        vault.setNominees(encryptedData, nominees, shares);
        
        vm.stopPrank();
    }
    
    function test_UpdateNomineesSuccess() public {
        vm.startPrank(user1);
        vault.deposit{value: 10 ether}(TEST_REF);
        
        // Initial setup
        address[] memory nominees1 = new address[](2);
        nominees1[0] = nominee1;
        nominees1[1] = nominee2;
        
        uint256[] memory shares1 = new uint256[](2);
        shares1[0] = 60;
        shares1[1] = 40;
        
        bytes memory encryptedData1 = abi.encode(nominees1, shares1);
        vault.setNominees(encryptedData1, nominees1, shares1);
        
        // Update nominees
        address[] memory nominees2 = new address[](3);
        nominees2[0] = nominee1;
        nominees2[1] = nominee2;
        nominees2[2] = nominee3;
        
        uint256[] memory shares2 = new uint256[](3);
        shares2[0] = 50;
        shares2[1] = 30;
        shares2[2] = 20;
        
        bytes memory encryptedData2 = abi.encode(nominees2, shares2);
        vault.updateNominees(encryptedData2, nominees2, shares2);
        
        NomineeVault.NomineeData memory config = vault.getNomineeConfig(user1);
        assertEq(config.nomineeCount, 3);
        
        vm.stopPrank();
    }
    
    function test_RemoveNomineesSuccess() public {
        vm.startPrank(user1);
        vault.deposit{value: 10 ether}(TEST_REF);
        
        address[] memory nominees = new address[](2);
        nominees[0] = nominee1;
        nominees[1] = nominee2;
        
        uint256[] memory shares = new uint256[](2);
        shares[0] = 60;
        shares[1] = 40;
        
        bytes memory encryptedData = abi.encode(nominees, shares);
        vault.setNominees(encryptedData, nominees, shares);
        
        vault.removeNominees();
        
        NomineeVault.NomineeData memory config = vault.getNomineeConfig(user1);
        assertEq(config.isActive, false);
        assertEq(config.nomineeCount, 0);
        
        vm.stopPrank();
    }
    
    // ==================== Inactivity & Claim Tests ====================
    
    function test_ClaimNomineeShareAfterInactivity() public {
        // Setup: User deposits and sets nominees
        vm.startPrank(user1);
        vault.deposit{value: 10 ether}(TEST_REF);
        
        address[] memory nominees = new address[](2);
        nominees[0] = nominee1;
        nominees[1] = nominee2;
        
        uint256[] memory shares = new uint256[](2);
        shares[0] = 60;
        shares[1] = 40;
        
        bytes memory encryptedData = abi.encode(nominees, shares);
        vault.setNominees(encryptedData, nominees, shares);
        vm.stopPrank();
        
        // Fast forward past inactivity period
        vm.warp(block.timestamp + 365 days + 1);
        
        // Nominee1 claims their 60% share
        vm.startPrank(nominee1);
        uint256 balanceBefore = nominee1.balance;
        
        vm.expectEmit(true, true, false, true);
        emit NomineeClaimed(user1, nominee1, 6 ether, 60, 0, block.timestamp);
        
        vault.claimNomineeShare(user1, 0);
        
        uint256 balanceAfter = nominee1.balance;
        assertEq(balanceAfter - balanceBefore, 6 ether);
        assertEq(vault.balanceOf(user1), 4 ether); // 10 - 6 = 4
        assertTrue(vault.isShareClaimed(user1, 0));
        
        vm.stopPrank();
        
        // Nominee2 claims their 40% share
        vm.startPrank(nominee2);
        uint256 nominee2BalanceBefore = nominee2.balance;
        
        vault.claimNomineeShare(user1, 1);
        
        uint256 nominee2BalanceAfter = nominee2.balance;
        assertEq(nominee2BalanceAfter - nominee2BalanceBefore, 4 ether);
        assertEq(vault.balanceOf(user1), 0); // All claimed
        assertTrue(vault.isShareClaimed(user1, 1));
        
        vm.stopPrank();
    }
    
    function test_ClaimFailsBeforeInactivity() public {
        vm.startPrank(user1);
        vault.deposit{value: 10 ether}(TEST_REF);
        
        address[] memory nominees = new address[](1);
        nominees[0] = nominee1;
        
        uint256[] memory shares = new uint256[](1);
        shares[0] = 100;
        
        bytes memory encryptedData = abi.encode(nominees, shares);
        vault.setNominees(encryptedData, nominees, shares);
        vm.stopPrank();
        
        // Try to claim immediately (should fail)
        vm.startPrank(nominee1);
        vm.expectRevert();
        vault.claimNomineeShare(user1, 0);
        vm.stopPrank();
    }
    
    function test_ClaimFailsAlreadyClaimed() public {
        vm.startPrank(user1);
        vault.deposit{value: 10 ether}(TEST_REF);
        
        address[] memory nominees = new address[](1);
        nominees[0] = nominee1;
        
        uint256[] memory shares = new uint256[](1);
        shares[0] = 100;
        
        bytes memory encryptedData = abi.encode(nominees, shares);
        vault.setNominees(encryptedData, nominees, shares);
        vm.stopPrank();
        
        vm.warp(block.timestamp + 365 days + 1);
        
        vm.startPrank(nominee1);
        vault.claimNomineeShare(user1, 0);
        
        // Try to claim again
        vm.expectRevert(abi.encodeWithSelector(NomineeVault.AlreadyClaimed.selector, 0));
        vault.claimNomineeShare(user1, 0);
        vm.stopPrank();
    }
    
    function test_ClaimFailsInvalidNomineeIndex() public {
        vm.startPrank(user1);
        vault.deposit{value: 10 ether}(TEST_REF);
        
        address[] memory nominees = new address[](2);
        nominees[0] = nominee1;
        nominees[1] = nominee2;
        
        uint256[] memory shares = new uint256[](2);
        shares[0] = 60;
        shares[1] = 40;
        
        bytes memory encryptedData = abi.encode(nominees, shares);
        vault.setNominees(encryptedData, nominees, shares);
        vm.stopPrank();
        
        vm.warp(block.timestamp + 365 days + 1);
        
        vm.startPrank(nominee1);
        vm.expectRevert(abi.encodeWithSelector(NomineeVault.InvalidNomineeIndex.selector, 5, 1));
        vault.claimNomineeShare(user1, 5);
        vm.stopPrank();
    }
    
    function test_ClaimFailsNotANominee() public {
        vm.startPrank(user1);
        vault.deposit{value: 10 ether}(TEST_REF);
        
        address[] memory nominees = new address[](1);
        nominees[0] = nominee1;
        
        uint256[] memory shares = new uint256[](1);
        shares[0] = 100;
        
        bytes memory encryptedData = abi.encode(nominees, shares);
        vault.setNominees(encryptedData, nominees, shares);
        vm.stopPrank();
        
        vm.warp(block.timestamp + 365 days + 1);
        
        // user2 (not a nominee) tries to claim
        vm.startPrank(user2);
        vm.expectRevert(abi.encodeWithSelector(NomineeVault.NotANominee.selector, user2));
        vault.claimNomineeShare(user1, 0);
        vm.stopPrank();
    }
    
    function test_PingActivityResetsTimer() public {
        vm.startPrank(user1);
        vault.deposit{value: 10 ether}(TEST_REF);
        
        address[] memory nominees = new address[](1);
        nominees[0] = nominee1;
        
        uint256[] memory shares = new uint256[](1);
        shares[0] = 100;
        
        bytes memory encryptedData = abi.encode(nominees, shares);
        vault.setNominees(encryptedData, nominees, shares);
        
        uint256 firstActivity = vault.lastActivity(user1);
        
        // Advance time
        vm.warp(block.timestamp + 100 days);
        
        // Ping activity
        vm.expectEmit(true, false, false, true);
        emit ActivityPinged(user1, block.timestamp);
        vault.pingActivity(TEST_REF);
        
        uint256 newActivity = vault.lastActivity(user1);
        assertGt(newActivity, firstActivity);
        assertEq(newActivity, block.timestamp);
        
        vm.stopPrank();
    }
    
    function test_UserCanReturnAndPreventClaims() public {
        vm.startPrank(user1);
        vault.deposit{value: 10 ether}(TEST_REF);
        
        address[] memory nominees = new address[](1);
        nominees[0] = nominee1;
        
        uint256[] memory shares = new uint256[](1);
        shares[0] = 100;
        
        bytes memory encryptedData = abi.encode(nominees, shares);
        vault.setNominees(encryptedData, nominees, shares);
        vm.stopPrank();
        
        // Advance almost to inactivity
        vm.warp(block.timestamp + 364 days);
        
        // User pings to prevent inactivity
        vm.prank(user1);
        vault.pingActivity(TEST_REF);
        
        // Advance past original deadline
        vm.warp(block.timestamp + 2 days);
        
        // Nominee tries to claim but fails (activity was reset)
        vm.startPrank(nominee1);
        vm.expectRevert();
        vault.claimNomineeShare(user1, 0);
        vm.stopPrank();
    }
    
    // ==================== Admin Functions Tests ====================
    
    function test_SetInactivityPeriod() public {
        uint256 newPeriod = 180 days;
        vault.setInactivityPeriod(newPeriod);
        assertEq(vault.inactivityPeriod(), newPeriod);
    }
    
    function test_SetInactivityPeriodFailsTooShort() public {
        vm.expectRevert(NomineeVault.InvalidInactivityPeriod.selector);
        vault.setInactivityPeriod(15 days);
    }
    
    function test_SetInactivityPeriodFailsTooLong() public {
        vm.expectRevert(NomineeVault.InvalidInactivityPeriod.selector);
        vault.setInactivityPeriod(800 days);
    }
    
    function test_SetInactivityPeriodFailsNotOwner() public {
        vm.startPrank(user1);
        vm.expectRevert();
        vault.setInactivityPeriod(180 days);
        vm.stopPrank();
    }
    
    function test_PauseAndUnpauseClaims() public {
        assertEq(vault.claimsPaused(), false);
        
        vault.setClaimsPaused(true);
        assertEq(vault.claimsPaused(), true);
        
        vault.setClaimsPaused(false);
        assertEq(vault.claimsPaused(), false);
    }
    
    function test_ClaimFailsWhenPaused() public {
        vm.startPrank(user1);
        vault.deposit{value: 10 ether}(TEST_REF);
        
        address[] memory nominees = new address[](1);
        nominees[0] = nominee1;
        
        uint256[] memory shares = new uint256[](1);
        shares[0] = 100;
        
        bytes memory encryptedData = abi.encode(nominees, shares);
        vault.setNominees(encryptedData, nominees, shares);
        vm.stopPrank();
        
        vm.warp(block.timestamp + 365 days + 1);
        
        // Pause claims
        vault.setClaimsPaused(true);
        
        vm.startPrank(nominee1);
        vm.expectRevert(NomineeVault.ClaimsPaused.selector);
        vault.claimNomineeShare(user1, 0);
        vm.stopPrank();
    }
    
    // ==================== View Functions Tests ====================
    
    function test_IsUserInactive() public {
        vm.startPrank(user1);
        vault.deposit{value: 1 ether}(TEST_REF);
        vm.stopPrank();
        
        assertEq(vault.isUserInactive(user1), false);
        
        vm.warp(block.timestamp + 365 days + 1);
        assertEq(vault.isUserInactive(user1), true);
    }
    
    function test_TimeUntilInactive() public {
        vm.startPrank(user1);
        vault.deposit{value: 1 ether}(TEST_REF);
        vm.stopPrank();
        
        uint256 timeRemaining = vault.timeUntilInactive(user1);
        assertEq(timeRemaining, 365 days);
        
        vm.warp(block.timestamp + 100 days);
        timeRemaining = vault.timeUntilInactive(user1);
        assertEq(timeRemaining, 265 days);
        
        vm.warp(block.timestamp + 265 days + 1);
        timeRemaining = vault.timeUntilInactive(user1);
        assertEq(timeRemaining, 0);
    }
    
    function test_GetEncryptedNomineeData() public {
        vm.startPrank(user1);
        vault.deposit{value: 10 ether}(TEST_REF);
        
        address[] memory nominees = new address[](2);
        nominees[0] = nominee1;
        nominees[1] = nominee2;
        
        uint256[] memory shares = new uint256[](2);
        shares[0] = 60;
        shares[1] = 40;
        
        bytes memory encryptedData = abi.encode(nominees, shares);
        vault.setNominees(encryptedData, nominees, shares);
        
        bytes memory retrieved = vault.getEncryptedNomineeData(user1);
        assertEq(keccak256(retrieved), keccak256(encryptedData));
        
        vm.stopPrank();
    }
    
    // ==================== Edge Case Tests ====================
    
    function test_MultipleNomineesProportionalDistribution() public {
        vm.startPrank(user1);
        vault.deposit{value: 100 ether}(TEST_REF);
        
        address[] memory nominees = new address[](3);
        nominees[0] = nominee1;
        nominees[1] = nominee2;
        nominees[2] = nominee3;
        
        uint256[] memory shares = new uint256[](3);
        shares[0] = 50;
        shares[1] = 30;
        shares[2] = 20;
        
        bytes memory encryptedData = abi.encode(nominees, shares);
        vault.setNominees(encryptedData, nominees, shares);
        vm.stopPrank();
        
        vm.warp(block.timestamp + 365 days + 1);
        
        // Each nominee claims
        vm.prank(nominee1);
        vault.claimNomineeShare(user1, 0);
        assertEq(nominee1.balance, 50 ether);
        
        vm.prank(nominee2);
        vault.claimNomineeShare(user1, 1);
        assertEq(nominee2.balance, 30 ether);
        
        vm.prank(nominee3);
        vault.claimNomineeShare(user1, 2);
        assertEq(nominee3.balance, 20 ether);
        
        assertEq(vault.balanceOf(user1), 0);
    }
    
    function test_ClaimWithZeroBalance() public {
        vm.startPrank(user1);
        // Deposit and withdraw all
        vault.deposit{value: 10 ether}(TEST_REF);
        
        address[] memory nominees = new address[](1);
        nominees[0] = nominee1;
        
        uint256[] memory shares = new uint256[](1);
        shares[0] = 100;
        
        bytes memory encryptedData = abi.encode(nominees, shares);
        vault.setNominees(encryptedData, nominees, shares);
        
        vault.withdrawAll(TEST_REF);
        vm.stopPrank();
        
        vm.warp(block.timestamp + 365 days + 1);
        
        vm.startPrank(nominee1);
        vm.expectRevert(ChainVaultCore.ZeroAmount.selector);
        vault.claimNomineeShare(user1, 0);
        vm.stopPrank();
    }
}
