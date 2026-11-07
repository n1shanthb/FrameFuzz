import {privateKeyToAccount,generatePrivateKey} from 'viem/accounts';
import {compileOwnedFixtures} from './compile.mjs';
import {assertSwarmEnabled,rejectNetworkWrites} from './gate.mjs';
import {frameMutationDefinition,generateFrameMutation} from '../mutations/frames.mjs';
import {prepareAuthorizationPair} from '../adapters/sender-validator.mjs';
const address=n=>'0x'+n.toString(16).padStart(40,'0');
export async function offlineSwarm(options={}){
  assertSwarmEnabled();rejectNetworkWrites(options);
  const compilation=await compileOwnedFixtures(),mutation=generateFrameMutation(frameMutationDefinition({seed:options.seed??42}));
  const ownerAccount=privateKeyToAccount(generatePrivateKey()),pairs=[];
  for(const [index,fixture]of ['unsafe','safe'].entries())pairs.push(await prepareAuthorizationPair({fixture,ownerAccount,sender:address(101+index),payer:address(200),target:address(300),nonce:0,mutation}));
  return {schema:'framefuzz.swarm.v1',milestone:1,generatedAt:new Date().toISOString(),source:'SWARM_SIMULATED — NO LLM',
    executionClass:'OFFLINE_SIGNATURE_BINDING — NO CONTRACT EXECUTION',featureFlag:'FRAMEFUZZ_SWARM=on',owner:ownerAccount.address,
    realLLMCalls:0,liveExecutions:0,deployments:0,unauthorizedActionProven:false,independentLiveReproduction:false,
    compilation,mutation,pairs,
    verdict:'INCONCLUSIVE',limitations:['Compiled Solidity and real ECDSA coverage checks only; bytecode was not executed','Placeholder fixture addresses are not deployments','Installed workshop hash differs from current EIP length-elision/envelope rules','No investigator/provider implemented before milestone4; no vulnerability or contract-level finding'],
    next:'Read-only preflight, then stop for separate live approval and a securely configured funded devnet wallet'};
}
