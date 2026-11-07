import {classifyAuthorizationExperiment} from './invariant.mjs';
import {SELF_FUNDED_CAP_WEI} from '../adapters/self-funded-validator.mjs';
import {toFunctionSelector} from 'viem';
const bad=(verdict,failureClass)=>({verdict,failureClass,finding:false});
export function classifySelfFundedExperiment(e){
 if(['transport','infrastructure','nonce','gas','layout','execution'].includes(e.failureClass))return classifyAuthorizationExperiment(e);
 if(!/^0x[\da-f]{40}$/i.test(e.sender??'')||e.sender.toLowerCase()!==e.payer?.toLowerCase())return bad('PRECONDITION_FAILURE','SENDER_PAYER_MISMATCH');
 let cost,balance;try{cost=BigInt(e.maximumCostWei);balance=BigInt(e.balanceWei);}catch{return bad('INCONCLUSIVE','FUNDING_UNKNOWN');}
 if(cost<=0n||cost>SELF_FUNDED_CAP_WEI||balance<0n)return bad('PRECONDITION_FAILURE','FEE_CAP');
 // Solvency errors take precedence over any generic authorization/revert claim.
 if(balance<cost)return bad('PRECONDITION_FAILURE','INSUFFICIENT_SENDER_BALANCE');
 if(e.layoutVerified!==true||e.actionFrameIndex!==1||e.baseline?.frameIndex!==1||e.baseline?.expectedCaller?.toLowerCase()!==e.sender.toLowerCase()||e.baseline?.payer?.toLowerCase()!==e.sender.toLowerCase()||e.baseline?.payerEvidenceVerified!==true)return bad('INCONCLUSIVE','SELF_PAYMENT_NOT_VERIFIED');
 if(e.fixture==='unsafe'&&(e.tampered?.frameIndex!==1||e.tampered?.expectedCaller?.toLowerCase()!==e.sender.toLowerCase()||e.tampered?.payer?.toLowerCase()!==e.sender.toLowerCase()||e.tampered?.payerEvidenceVerified!==true))return bad('INCONCLUSIVE','SELF_PAYMENT_NOT_VERIFIED');
 if(e.fixture==='safe'&&(e.tampered?.sender?.toLowerCase()!==e.sender.toLowerCase()||e.tampered?.authorizationRevertData!==toFunctionSelector('AuthorizationRejected()')||e.tampered?.errorOriginVerified!==true))return bad('INCONCLUSIVE','AUTHORIZATION_ERROR_UNVERIFIED');
 const result=classifyAuthorizationExperiment({...e,independentlyReproduced:false});
 if(result.verdict!=='BINDING_VIOLATED')return result;
 const repeat=e.independentReproduction;
 const sameScenario=repeat&&/^[\da-f]{64}$/i.test(e.originalDescriptorDigest??'')&&repeat.originalDescriptorDigest===e.originalDescriptorDigest&&
  ['baseline','tampered'].every(part=>['actualOperation','actualParameter'].every(field=>repeat[part]?.[field]===e[part]?.[field]));
 const fresh=sameScenario&&/^0x[\da-f]{40}$/i.test(repeat.sender??'')&&repeat.sender.toLowerCase()!==e.sender.toLowerCase();
 // Reproduction must itself pass the funded/action/payer checks in a fresh context.
 const reproduced=fresh?classifySelfFundedExperiment({...repeat,independentReproduction:undefined}):null;
 return {...result,finding:reproduced?.verdict==='BINDING_VIOLATED',independentlyReproduced:reproduced?.verdict==='BINDING_VIOLATED'};
}
