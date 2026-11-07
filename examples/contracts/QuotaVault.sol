// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice Self-contained BYOC acceptance fixture for FrameFuzz Playground.
/// Opaque quota accounting with typed ABI edges for local encoder/structure tools.
/// Not an EIP-8141 paymaster and not a live deployment target in LIVE_READ_ONLY.
contract QuotaVault {
    address public owner;
    uint256 public totalDeposited;
    mapping(address => uint256) public quotas;

    event QuotaSet(address indexed account, uint256 amount);
    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);

    error NotOwner();
    error ZeroAmount();
    error InsufficientQuota();

    constructor() {
        owner = msg.sender;
    }

    function setQuota(address account, uint256 amount) external {
        if (msg.sender != owner) revert NotOwner();
        quotas[account] = amount;
        emit QuotaSet(account, amount);
    }

    function deposit(uint8 amount) external {
        if (amount == 0) revert ZeroAmount();
        quotas[msg.sender] += amount;
        totalDeposited += amount;
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        uint256 available = quotas[msg.sender];
        if (available < amount) revert InsufficientQuota();
        quotas[msg.sender] = available - amount;
        emit Withdrawn(msg.sender, amount);
    }

    function remaining(address account) external view returns (uint256) {
        return quotas[account];
    }
}
