// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {OwnedSelfFundedBase} from "./OwnedSelfFundedBase.sol";
import {TxParam} from "@forshtat/hegota-support/contracts/Params.sol";
contract SenderValidatorSafeSelfFunded is OwnedSelfFundedBase {
    constructor(address owner, address action) OwnedSelfFundedBase(owner, action) {}
    function _authorizationHash() internal view override returns (bytes32) {
        return bytes32(txparam(TxParam.SIG_HASH));
    }
}
