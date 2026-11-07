// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {OwnedValidatorBase} from "./OwnedValidatorBase.sol";
import {TxParam} from "@forshtat/hegota-support/contracts/Params.sol";
/// Corrected research control: bind authorization to the executing client's canonical transaction hash.
contract SenderValidatorSafe is OwnedValidatorBase {
    constructor(address owner, address action, address payer) OwnedValidatorBase(owner, action, payer) {}
    function _authorizationHash() internal view override returns (bytes32) {
        return bytes32(txparam(TxParam.SIG_HASH));
    }
}
