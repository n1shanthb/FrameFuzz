// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {HegotaSupport, Devnet, Scope, TxParam, FrameParam, SigParam} from "@forshtat/hegota-support/contracts/HegotaSupport.sol";

/// Owned research fixtures only. No production account security model is claimed.
abstract contract OwnedValidatorBase is HegotaSupport(Devnet.ERC8421_WORKSHOP) {
    address public immutable OWNER;
    address public immutable ACTION;
    address public immutable PAYER;
    uint256 constant HALF_N = 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0;
    error InvalidFrameLayout();
    error InvalidWitness();
    error AuthorizationRejected();
    constructor(address owner, address action, address payer) {
        require(owner != address(0) && action != address(0) && payer != address(0));
        OWNER = owner; ACTION = action; PAYER = payer;
    }
    function _authorizationHash() internal view virtual returns (bytes32);
    fallback() external {
        if (txparam(TxParam.FRAME_COUNT) != 3 || txparam(TxParam.SIGNATURE_COUNT) != 1 ||
            txparam(TxParam.CURRENT_FRAME_INDEX) != 0 ||
            frameparam(0, FrameParam.RESOLVED_TARGET) != uint160(address(this)) ||
            frameparam(0, FrameParam.MODE) != 1 || frameparam(0, FrameParam.FLAGS) != 2 ||
            frameparam(1, FrameParam.RESOLVED_TARGET) != uint160(PAYER) ||
            frameparam(1, FrameParam.MODE) != 1 || frameparam(1, FrameParam.FLAGS) != 1 ||
            frameparam(2, FrameParam.RESOLVED_TARGET) != uint160(ACTION) ||
            frameparam(2, FrameParam.MODE) != 2 || frameparam(2, FrameParam.FLAGS) != 0 ||
            frameparam(0, FrameParam.VALUE) != 0 || frameparam(1, FrameParam.VALUE) != 0 ||
            frameparam(2, FrameParam.VALUE) != 0) revert InvalidFrameLayout();
        // Empty msg avoids self-referential signing. Never introspect ARBITRARY resolved_signer.
        if (sigparam(0, SigParam.SCHEME) != 0 || sigparam(0, SigParam.MSG) != 0 ||
            sigparam(0, SigParam.SIGNATURE_LENGTH) != 65) revert InvalidWitness();
        bytes memory witness = sigdatacopy(0, 65, 0);
        bytes32 r; bytes32 s; uint8 v;
        assembly ("memory-safe") {
            r := mload(add(witness, 32))
            s := mload(add(witness, 64))
            v := byte(0, mload(add(witness, 96)))
        }
        if ((v != 27 && v != 28) || uint256(r) == 0 || uint256(s) == 0 || uint256(s) > HALF_N) revert InvalidWitness();
        if (ecrecover(_authorizationHash(), v, r, s) != OWNER) revert AuthorizationRejected();
        // This executes in the sender account, never the separate payer.
        approve(Scope.EXECUTION);
    }
}
