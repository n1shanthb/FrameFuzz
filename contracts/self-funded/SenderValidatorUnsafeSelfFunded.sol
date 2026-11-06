// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {OwnedSelfFundedBase} from "./OwnedSelfFundedBase.sol";
import {TxParam} from "@forshtat/hegota-support/contracts/Params.sol";
/// INTENTIONALLY UNSAFE: calldata is absent from the partial owner commitment.
contract SenderValidatorUnsafeSelfFunded is OwnedSelfFundedBase {
    constructor(address owner, address action) OwnedSelfFundedBase(owner, action) {}
    function _authorizationHash() internal view override returns (bytes32) {
        return keccak256(abi.encode(block.chainid, address(this), txparam(TxParam.NONCE), ACTION));
    }
}
