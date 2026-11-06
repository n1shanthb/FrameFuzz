import {keccak256} from 'viem';
import {describeRpcError,describeRpcResult} from './verdict.mjs';

export const POLICY_STATUSES=Object.freeze(['ACCEPTED','REJECTED_POLICY','REJECTED_PRECONDITION','NOT_TESTED','INCONCLUSIVE_SHARED_STATE_RACE','SIMULATION_ONLY']);
const policyObservation=async fn=>{try{return describeRpcResult(await fn())}catch(error){return describeRpcError(error)}};
const tableStatus=observation=>observation?.status==='accepted'?'ACCEPTED':observation?.status==='rejected'&&observation.errorClass==='admission_policy'?'REJECTED_POLICY':observation?.status==='rejected'?'REJECTED_PRECONDITION':'NOT_TESTED';

/** Sequential rejection-first protocol for one exact signed identity.
 * All transports are injected; tests use mocks and preparation never invokes it.
 */
export async function comparePolicyCandidate({candidate,simulateCanonical,submitCanonical,submitAlternative,readState,readCanonicalReceipt,readAlternativeReport}){
 if(!candidate?.raw||!candidate?.wire||!/^0x[0-9a-f]{64}$/i.test(candidate.hash??'')||keccak256(candidate.raw).toLowerCase()!==candidate.hash.toLowerCase())throw Error('Signed candidate identity mismatch');
 const before=await readState();
 if(String(before.pendingNonce)!==String(candidate.nonce))throw Error('Candidate nonce differs from live pending nonce');
 let simulation=null;
 if(simulateCanonical){try{simulation={status:'SIMULATION_ONLY',result:await simulateCanonical(candidate.raw)};}catch(error){simulation={status:'SIMULATION_ONLY',error:describeRpcError(error)};}}
 const canonical=await policyObservation(()=>submitCanonical(candidate.raw));
 const canonicalStatus=tableStatus(canonical);
 let alternative={status:'NOT_TESTED',reason:'Canonical did not establish a policy rejection'},alternativeReport=null,race=false;
 if(canonicalStatus==='REJECTED_POLICY'){
  const [after,receipt]=await Promise.all([readState(),readCanonicalReceipt(candidate.hash)]);
  if(String(after.pendingNonce)!==String(before.pendingNonce)||receipt!==null){race=true;alternative={status:'INCONCLUSIVE_SHARED_STATE_RACE',reason:'Nonce or receipt changed after canonical response'};}
  else{
   const observed=await policyObservation(()=>submitAlternative(candidate.wire));
   alternative={...observed,status:tableStatus(observed)};
   alternativeReport=await readAlternativeReport(candidate.hash).catch(error=>({unavailable:String(error.message??error)}));
  }
 }
 const divergence=canonicalStatus==='REJECTED_POLICY'&&alternative.status==='ACCEPTED'&&alternativeReport?.admission?.outcome==='accepted';
 return {schema:'framefuzz.policy-comparison.v1',transactionIdentity:candidate.hash,sourceDigest:candidate.sourceDigest,simulation,canonical:{...canonical,status:canonicalStatus},alternative,alternativeReport,race,divergence:divergence?'POLICY_DIVERGENCE':'NONE',table:[{mutation:candidate.mutation,canonicalVerdict:canonicalStatus,alternativeVerdict:alternative.status,divergence:divergence?'POLICY_DIVERGENCE':'NO',reason:divergence?'Canonical policy rejection and independently recorded alternative acceptance':race?'Shared sender state changed before alternative submission':alternative.reason??canonical.message,evidence:{hash:candidate.hash,canonical,alternative,alternativeReport}}]};
}
