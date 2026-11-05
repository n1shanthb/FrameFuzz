// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {HegotaSupport} from "@forshtat/hegota-support/contracts/HegotaSupport.sol";
import {Devnet} from "@forshtat/hegota-support/contracts/Devnet.sol";
import {Scope} from "@forshtat/hegota-support/contracts/Params.sol";

interface IStateView {
    function getSlot0(bytes32 poolId)
        external
        view
        returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee);
}

/// Paymaster whose VERIFY frame optionally reads Uniswap v4 pool state via the real StateView predeploy.
/// Non-empty calldata triggers a staticcall (external state read) — unstaked alt-mempool should reject;
/// after the paymaster entity is staked, the same tx should be admitted (workshop ViolatingWallet pattern).
contract ReserveReadingPaymaster is HegotaSupport(Devnet.ERC8421_WORKSHOP) {
    address internal immutable STATE_VIEW;
    bytes32 internal immutable POOL_ID;

    constructor(address stateView_, bytes32 poolId_) payable {
        STATE_VIEW = stateView_;
        POOL_ID = poolId_;
    }

    fallback() external payable {
        if (msg.data.length == 1 && msg.data[0] == 0x02) {
            approve(Scope.EXECUTION_AND_PAYMENT);
            return;
        }
        if (msg.data.length >= 1 && msg.data[0] == 0x01) {
            (uint160 sqrtPriceX96,,,) = IStateView(STATE_VIEW).getSlot0(POOL_ID);
            sqrtPriceX96;
        }
        approve(Scope.PAYMENT);
    }
}
