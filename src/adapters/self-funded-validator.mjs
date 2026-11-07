import {frame,newTx,encodeTx,decodeTx,txHash} from '@forshtat/hegota-support/tx';
import {toWire} from '@forshtat/hegota-support/rpc';
import {recoverAddress,decodeFunctionData} from 'viem';
import {profile} from './workshop-codec.mjs';
import {assertSwarmEnabled} from '../swarm/gate.mjs';
import {unsafeIntentHash,workshopSigningHash,WORKSHOP_HASH} from '../swarm/signatures.mjs';
import {replayFrameMutation,ACTION_ABI} from '../mutations/frames.mjs';
export const SELF_FUNDED_VERSION='framefuzz.self-funded.v1';
export const SELF_FUNDED_CAP_WEI=1000000000000000n;
const address=a=>/^0x[\da-f]{40}$/i.test(a)&&!/^0x0{40}$/i.test(a);
export function unsignedSelfFundedTransaction({sender,target,data,nonce=0,chainId=1337,...unknown}){
 assertSwarmEnabled();if(Object.keys(unknown).length)throw new Error('Self-funded builder accepts no payer, RPC or fee overrides');
 if(chainId!==1337)throw new Error('Self-funded preparation restricted to chain1337');
 if(!address(sender)||!address(target)||sender.toLowerCase()===target.toLowerCase())throw new Error('Distinct owned sender and action required');
 if(!Number.isSafeInteger(nonce)||nonce<0||!/^0x(?:[\da-f]{2}){68}$/i.test(data))throw new Error('Invalid nonce or fixed recorder calldata');
 try{decodeFunctionData({abi:ACTION_ABI,data});}catch{throw new Error('Only ActionRecorder calldata is supported');}
 return newTx({chainId,sender,nonceKeys:[0n],nonceSeq:BigInt(nonce),frames:[
  frame(profile,'VERIFY',{scope:'EXECUTION_AND_PAYMENT',target:null,execution:60000n,data:'0x01'}),
  frame(profile,'SENDER',{target,execution:150000n,state:200000n,data}),
 ],signatures:[{scheme:0,signer:'0x',msg:'0x',signature:'0x'+'00'.repeat(65)}],fees:{maxFeePerGas:2000000000n}});
}
export function selfFundedFeeBound(tx){
 // For this fixed ARBITRARY/no-value/no-blob/no-roots layout only. Full wire bytes
 // overcount every charged data field. 64 gas/byte bounds the pinned client's
 // calldata floor (4 tokens/byte *16), as well as its standard data cost.
 if(tx.chainId!==1337n||!address(tx.sender)||!address(tx.frames[1]?.target)||tx.sender.toLowerCase()===tx.frames[1].target.toLowerCase()||tx.frames.length!==2||tx.frames[0].mode!==1||tx.frames[0].flags!==3||tx.frames[0].target!==null||tx.frames[0].data!=='0x01'||tx.frames[1].mode!==2||tx.frames[1].flags!==0||tx.frames.some(f=>f.value!==0n)||
  tx.frames[0].limits.execution!==60000n||tx.frames[0].limits.state!==0n||tx.frames[1].limits.execution!==150000n||tx.frames[1].limits.state!==200000n||
  tx.signatures.length!==1||tx.signatures[0].scheme!==0||tx.signatures[0].msg!=='0x'||tx.signatures[0].signer!=='0x'||tx.signatures[0].signature.length!==132||
  tx.blobVersionedHashes.length||tx.recentRootReferences.length||tx.fees.maxFeePerBlobGas!==0n||tx.fees.maxFeePerGas!==2000000000n||tx.fees.maxPriorityFeePerGas>tx.fees.maxFeePerGas||
  tx.nonceKeys.length!==1||tx.nonceKeys[0]!==0n)throw new Error('Unsupported self-funded fee envelope');
 try{decodeFunctionData({abi:ACTION_ABI,data:tx.frames[1].data});}catch{throw new Error('Unsupported recorder action');}
 const wireBytes=BigInt((encodeTx(profile,tx).length-2)/2);
 const frameGas=tx.frames.reduce((n,f)=>n+f.limits.execution+f.limits.state,0n);
 const gasUpperBound=12000n+2n*475n+frameGas+64n*wireBytes;
 if(gasUpperBound>500000n||gasUpperBound*tx.fees.maxFeePerGas>SELF_FUNDED_CAP_WEI)throw new Error('Self-funded fee cap exceeded');
 return {wireBytes:String(wireBytes),gasUpperBound:String(gasUpperBound),derivedMaxFeeUpperBoundWei:String(gasUpperBound*tx.fees.maxFeePerGas),proposedFeeCapWei:String(SELF_FUNDED_CAP_WEI),requiredFundingWei:String(SELF_FUNDED_CAP_WEI),assumption:'Pinned advertised-client gas schedule; runtime unverified. Contract independently checks TXPARAM(MAX_COST) <=cap.'};
}
export async function prepareSelfFundedPair({fixture,ownerAccount,sender,target,nonce=0,mutation}){
 if(!['unsafe','safe'].includes(fixture))throw new Error('Unknown self-funded fixture');
 replayFrameMutation(mutation);
 const authorized=unsignedSelfFundedTransaction({sender,target,nonce,data:mutation.authorized.data});
 const digest=tx=>fixture==='safe'?workshopSigningHash(tx):unsafeIntentHash({chainId:1337,sender,nonce,target:tx.frames[1].target});
 const ownerDigest=digest(authorized),witness=await ownerAccount.sign({hash:ownerDigest});
 if(!/^0x[\da-f]{130}$/i.test(witness))throw new Error('Canonical65-byte owner witness required');
 authorized.signatures[0].signature=witness;const tampered=structuredClone(authorized);tampered.frames[1].data=mutation.tampered.data;
 const encode=tx=>({transaction:tx,raw:encodeTx(profile,tx),wire:toWire(tx),computedHash:txHash(profile,tx),canonicalHash:workshopSigningHash(tx),feeBound:selfFundedFeeBound(tx)});
 const a=encode(authorized),b=encode(tampered);if(encodeTx(profile,decodeTx(profile,a.raw))!==a.raw)throw new Error('Self-funded codec roundtrip failed');
 const recovered=async tx=>(await recoverAddress({hash:digest(tx),signature:witness})).toLowerCase()===ownerAccount.address.toLowerCase();
 return {version:SELF_FUNDED_VERSION,classification:'OFFLINE_SELF_FUNDED_SIGNATURE_BINDING',hashProfile:WORKSHOP_HASH,liveHashCompatibility:'UNVERIFIED',sender,payer:sender,actionFrameIndex:1,ownerDigest,
  authorized:a,tampered:b,invariants:{sameWitness:authorized.signatures[0].signature===tampered.signatures[0].signature,sameTarget:authorized.frames[1].target===tampered.frames[1].target,canonicalHashChanged:a.canonicalHash!==b.canonicalHash,authorizedOwnerRecovered:await recovered(authorized),tamperedOwnerRecovered:await recovered(tampered)},broadcasts:0};
}
