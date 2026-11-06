// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
/// Owned test action only. Records actual individual action execution per sender account.
contract ActionRecorder {
    struct Action { uint256 operation; uint256 parameter; uint256 count; }
    mapping(address => Action) public actions;
    event ActionRecorded(address indexed caller, uint256 operation, uint256 parameter, uint256 count);
    function record(uint256 operation, uint256 parameter) external {
        uint256 count = actions[msg.sender].count + 1;
        actions[msg.sender] = Action(operation, parameter, count);
        emit ActionRecorded(msg.sender, operation, parameter, count);
    }
}
