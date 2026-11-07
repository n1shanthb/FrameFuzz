// Adapted from forshtat/mempool-workshop bcfe02a196ca97b6fb0d1044db9d0b4c673831fc
// src/lib/frameTx/{build,codec,profile}.ts and supplied fast_gate_rerun.ts.
// Encoding/signing is performed by the actual pinned upstream package, never a mock.
import * as lib from '@forshtat/hegota-support/tx';
import { toWire } from '@forshtat/hegota-support/rpc';
import { getProfile } from '@forshtat/hegota-support/profiles';
export const profile = getProfile('ethrex-eip8141-tracer');

export async function buildSponsored({ sender, payer, recipient, nonce, chainId, privateKey, verificationGas = 50000, poolRead = false, maxFeePerGas = 2000000000n }) {
  if (chainId !== 1337) throw new Error('Workshop codec is restricted to the authorized chain 1337');
  const tx = lib.newTx({ chainId, sender, nonceSeq: BigInt(nonce),
    frames: [
      lib.frame(profile, 'VERIFY', { scope: 'EXECUTION', target: null, execution: 30000n }),
      lib.frame(profile, 'VERIFY', { scope: 'PAYMENT', target: payer, execution: BigInt(verificationGas), data: poolRead ? '0x01' : '0x' }),
      lib.frame(profile, 'SENDER', { target: recipient, execution: 50000n }),
    ], signatures: [lib.secp256k1Placeholder(profile)], fees: { maxFeePerGas } });
  const signed = await lib.signTx(profile, tx, privateKey);
  return { raw: lib.encodeTx(profile, signed), wire: toWire(signed), hash: lib.txHash(profile, signed), signed };
}
