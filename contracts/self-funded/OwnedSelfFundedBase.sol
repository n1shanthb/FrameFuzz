// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {HegotaSupport, Devnet, Scope, TxParam, FrameParam, SigParam} from "@forshtat/hegota-support/contracts/HegotaSupport.sol";

/// Isolated, owned self-funded research fixture; not a production account.
abstract contract OwnedSelfFundedBase is HegotaSupport(Devnet.ERC8421_WORKSHOP) {
    address public immutable OWNER;
    address public immutable ACTION;
    uint256 public constant MAX_TX_FEE_WEI = 1_000_000_000_000_000;
    uint256 public constant MAX_GAS_PRICE_WEI = 2_000_000_000;
    uint256 constant HALF_N = 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0;
    error InvalidFrameLayout();
    error InvalidWitness();
    error AuthorizationRejected();
    error FeeCapExceeded();
    constructor(address owner, address action) {
        require(owner != address(0) && action != address(0) && owner != action);
        OWNER = owner; ACTION = action;
    }
    // Funding transfers must succeed without granting any execution/payment approval.
    receive() external payable {}
    function _authorizationHash() internal view virtual returns (bytes32);
    fallback() external {
        // Nonempty marker routes VERIFY to fallback rather than the funding receiver.
        if (msg.data.length != 1 || msg.data[0] != 0x01 ||
            txparam(TxParam.FRAME_COUNT) != 2 || txparam(TxParam.SIGNATURE_COUNT) != 1 ||
            txparam(TxParam.CURRENT_FRAME_INDEX) != 0 || txparam(TxParam.BLOB_COUNT) != 0 ||
            frameparam(0, FrameParam.RESOLVED_TARGET) != uint160(address(this)) ||
            frameparam(0, FrameParam.MODE) != 1 || frameparam(0, FrameParam.FLAGS) != 3 ||
            frameparam(1, FrameParam.RESOLVED_TARGET) != uint160(ACTION) ||
            frameparam(1, FrameParam.MODE) != 2 || frameparam(1, FrameParam.FLAGS) != 0 ||
            frameparam(0, FrameParam.VALUE) != 0 || frameparam(1, FrameParam.VALUE) != 0)
            revert InvalidFrameLayout();
        if (txparam(TxParam.MAX_COST) > MAX_TX_FEE_WEI || txparam(TxParam.MAX_FEE) > MAX_GAS_PRICE_WEI)
            revert FeeCapExceeded();
        if (sigparam(0, SigParam.SCHEME) != 0 || sigparam(0, SigParam.MSG) != 0 ||
            sigparam(0, SigParam.SIGNATURE_LENGTH) != 65) revert InvalidWitness();
        bytes memory witness = sigdatacopy(0, 65, 0);
        bytes32 r; bytes32 s; uint8 v;
        assembly ("memory-safe") {
            r := mload(add(witness, 32))
            s := mload(add(witness, 64))
            v := byte(0, mload(add(witness, 96)))
        }
        if ((v != 27 && v != 28) || uint256(r) == 0 || uint256(s) == 0 || uint256(s) > HALF_N)
            revert InvalidWitness();
        if (ecrecover(_authorizationHash(), v, r, s) != OWNER) revert AuthorizationRejected();
        // Both permissions are granted only after owner authorization, on this sender.
        approve(Scope.EXECUTION_AND_PAYMENT);
    }
}
