import { readFile } from 'node:fs/promises';
import { createAdapter } from '../../src/adapters/index.mjs';
import { workshopPlugin } from '../../src/adapters/workshop-live.mjs';

export async function liveCases(kind, variants = [{ suffix: 'baseline', value: 50000 }]) {
  const config = JSON.parse(await readFile(new URL('./devnet.json', import.meta.url), 'utf8'));
  const adapter = createAdapter(workshopPlugin(config));
  return variants.map(v => {
    const caseId = `${kind}-${v.suffix}-${v.value}`;
    return { id: caseId, family: 'uniswap-v4-paymaster', category: kind === 'staked' ? 'Staked Uniswap pool read' : 'Basic sponsorship',
      description: 'Fresh independently signed transactions using the supplied PoC sponsors and official workshop codec',
      mutation: v.suffix === 'baseline' ? null : { family: 'verification-gas', field: 'payerVerificationGas', value: v.value, boundary: 67200,
        derivation: '100000 total prefix - 30000 sender VERIFY - 2800 secp256k1 intrinsic cost' },
      ruleProvenance: { status: 'SOURCE_REVIEWED_DEPLOYMENT_PARTIAL', ...config.provenance,
        note: 'Execution client commit verified by web3_clientVersion. Sidecar v4.1.1 exposes an empty commit; exact source/deployment equivalence is not attested.' },
      paths: ['public', 'alt'].map(pathId => {
        const rejected = kind === 'staked' && pathId === 'public' || v.value > 67200;
        return { id: pathId, method: pathId === 'public' ? 'eth_sendRawTransaction' : 'eth_sendFrameTransaction', adapterMode: 'LIVE',
          expected: rejected ? 'rejected' : 'accepted',
          expectedRule: kind === 'staked' && pathId === 'public' ? 'StorageReadNonSender' : v.value > 67200 ? ['MAX_VERIFY_GAS', 'VerificationGasLimit', 'validation gas', 'validation prefix'] : null,
          prepare: context => adapter.build({ ...context, caseId, pathId,
            setup: { staked: kind === 'staked', poolRead: kind === 'staked', configuration: { kind } },
            model: { poolRead: kind === 'staked', verificationGasLimit: v.value } }) };
      }) };
  });
}
