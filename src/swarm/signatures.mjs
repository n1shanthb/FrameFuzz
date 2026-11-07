import {encodeAbiParameters,keccak256,toRlp,numberToHex,concat} from 'viem';
import {sigHash} from '@forshtat/hegota-support/tx';
import {profile} from '../adapters/workshop-codec.mjs';
export const WORKSHOP_HASH='workshop-0.0.1-empty-elision';
export const CURRENT_EIP_HASH='eip8141-length-elision-2026-11-06';
const int=value=>BigInt(value)===0n?'0x':numberToHex(BigInt(value));
export const unsafeIntentHash=({chainId,sender,nonce,target})=>keccak256(encodeAbiParameters([{type:'uint256'},{type:'address'},{type:'uint256'},{type:'address'}],[BigInt(chainId),sender,BigInt(nonce),target]));
export const workshopSigningHash=tx=>sigHash(profile,tx);
/** Current EIP payload, not the workshop's keyed-nonce/rate-fee envelope. */
export function currentEipSignatureHash(tx){
  if(tx.nonce===undefined||tx.fees?.maxFee===undefined)throw new Error('Current EIP vector requires scalar nonce and aggregate fees.maxFee; do not mix workshop envelopes');
  const signatures=tx.signatures.map(s=>{
    if(!['0x',undefined].includes(s.signer)&&s.scheme===0)throw new Error('ARBITRARY signer must be empty');
    if(s.msg!=='0x'&&(!/^0x[\da-f]{64}$/i.test(s.msg)||/^0x0{64}$/i.test(s.msg)))throw new Error('Invalid explicit signature msg');
    if(!/^0x(?:[\da-f]{2})*$/i.test(s.signature))throw new Error('Invalid witness bytes');
    return [int(s.scheme),s.signer??'0x',s.msg,s.msg==='0x'?int((s.signature.length-2)/2):s.signature];
  });
  const frames=tx.frames.map(f=>[int(f.mode),int(f.flags),f.target??'0x',[int(f.limits.execution),int(f.limits.state)],int(f.value),f.data]);
  return keccak256(concat(['0x06',toRlp([int(tx.chainId),int(tx.nonce),tx.sender,frames,signatures,[int(tx.fees.maxFee),int(tx.fees.maxPriorityFeePerGas)],tx.blobVersionedHashes??[]])]));
}
