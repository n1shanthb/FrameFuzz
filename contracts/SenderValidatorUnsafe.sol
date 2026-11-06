// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {OwnedValidatorBase} from "./OwnedValidatorBase.sol";
import {TxParam} from "@forshtat/hegota-support/contracts/Params.sol";
/// INTENTIONALLY UNSAFE owned fixture: calldata is absent from the owner's authorization.
contract SenderValidatorUnsafe is OwnedValidatorBase {
    constructor(address owner, address action, address payer) OwnedValidatorBase(owner, action, payer) {}
    function _authorizationHash() internal view override returns (bytes32) {
        return keccak256(abi.encode(block.chainid, address(this), txparam(TxParam.NONCE), ACTION));
    }
}
