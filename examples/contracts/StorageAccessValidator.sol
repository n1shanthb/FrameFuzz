// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {HegotaSupport} from "@forshtat/hegota-support/contracts/HegotaSupport.sol";
import {Devnet} from "@forshtat/hegota-support/contracts/Devnet.sol";
import {Scope, SigParam} from "@forshtat/hegota-support/contracts/Params.sol";

/// Storage target whose slot 0 is read by ViolatingWallet during VERIFY.
/// Workshop reference: forshtat/mempool-workshop Foreign.sol
contract Foreign {
    fallback() external {
        assembly {
            mstore(0, sload(0))
            return(0, 32)
        }
    }
}

/// Official workshop storage-access policy wallet.
/// VERIFY with nonempty data → FOREIGN.staticcall → StorageReadNonSender on ethrex;
/// after the wallet stakes itself, Skandha can admit the same signed transaction.
/// Capability label: FrameFuzz supports this exact SENDER_VALIDATOR interface for live admission comparison.
contract ViolatingWallet is HegotaSupport(Devnet.ERC8421_WORKSHOP) {
    address public immutable owner;
    address internal immutable FOREIGN;

    constructor(address owner_, address foreign_) payable {
        owner = owner_;
        FOREIGN = foreign_;
    }

    fallback() external payable {
        require(address(uint160(sigparam(0, SigParam.RESOLVED_SIGNER))) == owner, "bad signer");
        if (msg.data.length > 0) {
            (bool read, ) = FOREIGN.staticcall("");
            read;
        }
        approve(Scope.EXECUTION_AND_PAYMENT);
    }
}
