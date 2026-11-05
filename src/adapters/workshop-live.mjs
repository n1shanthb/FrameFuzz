import { readFile } from 'node:fs/promises';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { encodeFunctionData, keccak256 } from 'viem';
import { rpc } from '../rpc.mjs';
import { assertTestChain } from '../safety.mjs';
import { buildSponsored } from './workshop-codec.mjs';

const DEPOSIT_ABI = [{ type: 'function', name: 'getDepositInfo', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }, { type: 'uint32' }, { type: 'uint64' }] }];
const SLOT_ABI = [{ type:'function', name:'getSlot0', stateMutability:'view', inputs:[{type:'bytes32'}], outputs:[{type:'uint160'},{type:'int24'},{type:'uint24'},{type:'uint24'}] }];
const ADDRESS = /^0x[\da-f]{40}$/i;

/** Reuses already deployed PoC sponsors; no shared/genesis key or faucet needed.
 * Fresh ephemeral sender keys are held only in memory. Setup checks current state
 * and fails closed when sponsorship/staking/deployment requirements aren't met.
 */
export function workshopPlugin(config, { rpcFn = rpc, keyFactory = generatePrivateKey } = {}) {
  if (config.chainId !== 1337) throw new Error('LIVE configuration must explicitly authorize chain 1337');
  for (const key of ['recipient', 'stakingRegistry']) if (!ADDRESS.test(config[key] ?? '')) throw new Error(`Invalid LIVE ${key}`);
  const allowed = new Set(config.authorizedEndpoints ?? []);
  if (!allowed.size) throw new Error('Explicit authorizedEndpoints required');
  async function checked(context) {
    if (!allowed.has(context.rpcUrl)) throw new Error('Endpoint is not in the authorized devnet configuration');
    assertTestChain(Number(BigInt(await rpcFn(context.rpcUrl, 'eth_chainId'))), 1337);
  }
  return {
    id: 'workshop-hegota-0.0.1', mode: 'LIVE',
    async accountFor(context) {
      await checked(context);
      const privateKey = keyFactory();
      return { sender: privateKeyToAccount(privateKey).address, privateKey };
    },
    async setup(context) {
      await checked(context);
      const kind = context.setup.configuration.kind;
      const payer = config.paymasters[kind];
      if (!ADDRESS.test(payer ?? '')) throw new Error(`No deployed paymaster configured for ${kind}`);
      const code = await rpcFn(context.rpcUrl, 'eth_getCode', [payer, 'latest']);
      if (!/^0x[\da-f]+$/i.test(code) || code === '0x') throw new Error('Paymaster has no deployed bytecode');
      if (config.paymasterCodeHashes?.[kind] && keccak256(code) !== config.paymasterCodeHashes[kind]) throw new Error('Paymaster bytecode changed since configuration was pinned');
      const balance = BigInt(await rpcFn(context.rpcUrl, 'eth_getBalance', [payer, 'latest']));
      const required = BigInt(config.minSponsorBalanceWei ?? '1000000000000000');
      if (balance < required) throw new Error('Sponsor funding insufficient; creation-value funding/setup required');
      const stakeData = encodeFunctionData({ abi: DEPOSIT_ABI, functionName: 'getDepositInfo', args: [payer] });
      const stake = await rpcFn(context.rpcUrl, 'eth_call', [{ to: config.stakingRegistry, data: stakeData }, 'latest']);
      if (!/^0x[\da-f]{192}$/i.test(stake)) throw new Error('Invalid staking registry response');
      const amount = BigInt(`0x${stake.slice(2,66)}`), delay = BigInt(`0x${stake.slice(66,130)}`), withdraw = BigInt(`0x${stake.slice(130,194)}`);
      const staked = amount >= BigInt(config.minStakeWei ?? '10000000000000000') && delay >= 86400n && withdraw === 0n;
      if (staked !== Boolean(context.setup.staked)) throw new Error(`Paymaster stake does not match scenario ${kind}`);
      if (context.setup.poolRead) {
        const code = await rpcFn(context.rpcUrl, 'eth_getCode', [config.stateView, 'latest']);
        if (code === '0x') throw new Error('StateView has no deployed bytecode');
        const data = encodeFunctionData({ abi: SLOT_ABI, functionName: 'getSlot0', args: [config.poolId] });
        const result = await rpcFn(context.rpcUrl, 'eth_call', [{ to: config.stateView, data }, 'latest']);
        if (!/^0x[\da-f]{256}$/i.test(result)) throw new Error('StateView.getSlot0 returned malformed pool data');
      }
      context.account.payer = payer;
      context.account.kind = kind;
      context.account.payerBalance = balance.toString();
    },
    async getNonce(context) {
      const value = await rpcFn(context.rpcUrl, 'eth_getTransactionCount', [context.account.sender, 'pending']);
      const balance = await rpcFn(context.rpcUrl, 'eth_getBalance', [context.account.sender, 'latest']);
      if (BigInt(value) !== 0n || BigInt(balance) !== 0n) throw new Error('Fresh sponsored sender must have nonce zero and zero ETH');
      context.account.senderBalance = BigInt(balance).toString();
      return BigInt(value);
    },
    async sign(context) {
      await checked(context);
      const verificationGas = context.model.verificationGasLimit ?? 50000;
      const built = await buildSponsored({ sender: context.sender, payer: context.account.payer, recipient: config.recipient,
        nonce: context.nonce, chainId: context.chainId, privateKey: context.account.privateKey,
        poolRead: context.model.poolRead ?? false, verificationGas });
      return { raw: built.raw,
        submission: { method: context.pathId === 'public' ? 'eth_sendRawTransaction' : 'eth_sendFrameTransaction', params: [context.pathId === 'public' ? built.raw : built.wire] },
        evidence: { hash: built.hash, payer: context.account.payer, payerBalance: context.account.payerBalance, senderBalance: context.account.senderBalance,
          verificationGas, stateView: context.model.poolRead ? config.stateView : undefined, poolId: context.model.poolRead ? config.poolId : undefined } };
    },
  };
}

export default async function () {
  const filename = process.env.FRAMEFUZZ_LIVE_CONFIG;
  if (!filename) throw new Error('Set FRAMEFUZZ_LIVE_CONFIG to the verified devnet configuration file');
  return workshopPlugin(JSON.parse(await readFile(filename, 'utf8')));
}
