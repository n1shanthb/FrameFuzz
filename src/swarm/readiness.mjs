import {readFile} from 'node:fs/promises';
import {keccak256} from 'viem';
import {decodeTx,encodeTx} from '@forshtat/hegota-support/tx';
import {profile} from '../adapters/workshop-codec.mjs';
import {workshopSigningHash,currentEipSignatureHash} from './signatures.mjs';
import {compileOwnedFixtures} from './compile.mjs';
import {assertSwarmEnabled,rejectNetworkWrites} from './gate.mjs';
import {frameDigest,replayFrameMutation} from '../mutations/frames.mjs';
import {validateHypothesis} from './hypothesis.mjs';

export async function compareClientVector(){
 const vector=JSON.parse(await readFile(new URL('./vectors/ethrex-9aa364.json',import.meta.url),'utf8'));
 const tx=decodeTx(profile,vector.raw),hash=workshopSigningHash(tx),longer=structuredClone(tx);
 longer.signatures[0].signature+='00';
 const modern={chainId:tx.chainId,nonce:tx.nonceSeq,sender:tx.sender,frames:tx.frames,signatures:tx.signatures,fees:{maxFee:tx.fees.maxFeePerGas,maxPriorityFeePerGas:tx.fees.maxPriorityFeePerGas},blobVersionedHashes:[]};
 const modernLonger=structuredClone(modern);modernLonger.signatures[0].signature+='00';
 return {source:vector.source,sourceSha256:vector.sourceSha256,test:vector.test,expectedHash:vector.signatureHash,actualHash:hash,
  byteRoundtrip:encodeTx(profile,tx)===vector.raw,sourceVectorMatches:hash===vector.signatureHash,
  workshopCommitsToWitnessLength:hash!==workshopSigningHash(longer),currentEipCommitsToWitnessLength:currentEipSignatureHash(modern)!==currentEipSignatureHash(modernLonger),
  sourceAgreement:hash===vector.signatureHash?'VERIFIED_VECTOR':'UNVERIFIED',runtimeCompatibility:'UNVERIFIED',reason:'Advertised commit source/vector agrees; no runtime canonical hash response or owned baseline execution obtained'};
}

/** Preparation only: no signing key, signer, RPC or write transport is accepted here. */
export async function prepareLiveProof({investigation,preflight,secondHead,variant=1,...options}){
 assertSwarmEnabled();rejectNetworkWrites(options);
 if(Object.keys(options).length)throw new Error('Unknown readiness option');
 if(!Number.isSafeInteger(variant)||variant<0||variant>1)throw new Error('Select executed Sonnet variant0 or1');
 if(investigation?.schema!=='framefuzz.investigation.v1'||investigation.source!=='OPENROUTER_MODEL_INVESTIGATION'||investigation.status!=='COMPLETE_OFFLINE_INVESTIGATION'||investigation.realLLMCalls<4||investigation.provider?.transport!=='OPENROUTER')throw new Error('Completed real model investigation required');
 const experiment=investigation.experiments?.[variant];if(!experiment)throw new Error('Selected model experiment missing');
 const h=validateHypothesis(experiment.hypothesis),descriptor=experiment.execution.descriptor;
 const {contentDigest,...body}=descriptor;
 if(frameDigest(body)!==contentDigest)throw new Error('Model descriptor integrity mismatch');
 const mutation=replayFrameMutation(descriptor.mutation);
 if(h.operation!==mutation.tampered.operation||h.parameter!==mutation.tampered.parameter||!investigation.proposals.some(p=>p.origin==='OPENROUTER'&&JSON.stringify(p.hypothesis)===JSON.stringify(h)))throw new Error('Selected values do not match actual model proposal');
 const compiled=await compileOwnedFixtures();
 if(compiled.inputDigest!==descriptor.compilerInputDigest||compiled.compiler!==descriptor.compiler||frameDigest(compiled.sourceDigests)!==frameDigest(descriptor.sourceDigests))throw new Error('Owned fixture provenance changed');
 if(preflight?.schema!=='framefuzz.swarm-preflight.v1'||preflight.chainId!==1337||preflight.endpoint!=='https://altmempool.forshtat.com/rpc')throw new Error('Authorized chain1337 preflight required');
 const validSecond=secondHead?.endpoint==='https://altmempool.forshtat.com'&&secondHead.method==='eth_getBlockByNumber'&&Date.parse(secondHead.observedAt)>Date.parse(preflight.generatedAt);
 const headAdvancing=validSecond&&secondHead.block?.number&&preflight.latestBlock?.number?BigInt(secondHead.block.number)>BigInt(preflight.latestBlock.number)?'YES':'NO':'UNKNOWN';
 const compatibility=await compareClientVector(),plan=structuredClone(preflight.deploymentPlan);
 const sponsorReady=!preflight.blockers.some(x=>/sponsor/i.test(x))&&BigInt(preflight.sponsor.balanceWei)>0n;
 plan.submissions=plan.submissions.map(s=>({...s,submittedAction:s.role.endsWith('tampered')?{operation:h.operation,parameter:h.parameter}:{operation:1,parameter:10},
  data:s.role.endsWith('tampered')?mutation.tampered.data:mutation.authorized.data,
  authorization:{intent:mutation.authorized,policy:'Sign A independently for this fresh sender/context; retain exactly that witness for B; never sign B'},
  nonceRequirement:'Key0 uses the account nonce in advertised client source. Verify eth_getTransactionCount(sender, latest/pending); NONCE_MANAGER storage alone is insufficient.',
  maxTotalGasBudget:'500000',maxFeePerGas:'2000000000',maximumFeeWei:'1000000000000000',gasSufficiency:'UNVERIFIED - require authorized baselines and per-frame receipts',
  expected:s.role==='safe_tampered'?'AUTHORIZATION_REJECTED_NO_ACTION_HYPOTHESIS':'ACTION_EXECUTED_HYPOTHESIS'}));
 plan.deployments=plan.deployments.map(d=>({...d,initCodeHash:d.initCode?keccak256(d.initCode):null}));
 const blockers=[...preflight.blockers,'Read-only preparation cannot establish successful individual action execution','All live writes require separate approval of resolved addresses, fresh state and exact fee exposure'];
 if(headAdvancing!=='YES')blockers.push('Execution head advancement not demonstrated');
 return {schema:'framefuzz.live-proof-readiness.v1',generatedAt:new Date().toISOString(),classification:'READINESS_ONLY',chainId:1337,
  endpoints:{admission:preflight.endpoint,execution:'https://altmempool.forshtat.com'},investigationDigest:frameDigest(investigation),selectedVariant:variant,
  model:{provider:investigation.provider.provider,name:investigation.provider.model,proposal:h,mutationValues:{operation:h.operation,parameter:h.parameter},descriptorDigest:contentDigest},
  compiler:{version:compiled.compiler,inputDigest:compiled.inputDigest,sourceDigests:compiled.sourceDigests},compatibility,headAdvancing,sponsorReady,
  wallet:preflight.wallet,fundedDeployerConfigured:preflight.wallet.secureKeyConfigured&&BigInt(preflight.wallet.balanceWei??0)>=64000000000000000n,
  manifestReady:false,technicallyReadyForApproval:false,approvalRequired:true,liveTransactionsSent:0,deploymentsSent:0,broadcastCapability:false,
  plan:{...plan,deploymentCount:5,submissionCount:4,frameFeeUpperBoundWei:'4000000000000000',totalFeeUpperBoundWei:'64000000000000000',
   feeScope:'0.06 test ETH deployment cap plus0.004 test ETH frame cap; excludes sponsor restoration/funding, which has no approved plan. Not an estimate; enforce encoded gas/max-cost before signing.',
   sponsorRestoration:'NOT_PLANNED - do not silently deploy/fund a replacement sponsor',
   executionOrder:['Deploy ActionRecorder and four isolated sender validators only after approval','Capture clean action state and nonce/funding/code checks for each sender','unsafe_authorized and safe_authorized must execute record(1,10) successfully','unsafe_tampered and safe_tampered each retain their own original A authorization; signers/targets/nonces are runtime-owned','Stop on baseline failure, nonce/funding/gas error, client drift or transport failure; no retries'],
   evidenceRequired:['Actual signed intent and retained original witness per isolated account','Raw RPC response and transaction hash; admission alone insufficient','Canonical receipt block/hash and successful individual action frame2','Decode ActionRecorded at owned recorder, match caller/operation/parameter/count and actions(sender) state','Safe exact AuthorizationRejected selector from owned sender plus unchanged state and no action log at a bounded canonical observation','Source/compiler/client/code hashes and nonce/funding checks','Independent repetition uses a fresh five-contract context and four new submissions; not included in this plan']},blockers};
}
