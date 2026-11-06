import {frame,newTx,encodeTx,decodeTx,txHash} from '@forshtat/hegota-support/tx';
import {toWire} from '@forshtat/hegota-support/rpc';
import {recoverAddress} from 'viem';
import {profile} from './workshop-codec.mjs';
import {unsafeIntentHash,workshopSigningHash,WORKSHOP_HASH} from '../swarm/signatures.mjs';
import {assertSwarmEnabled} from '../swarm/gate.mjs';
const ADDRESS=/^0x[\da-f]{40}$/i;
export function unsignedValidatorTransaction({sender,payer,target,data,nonce=0,chainId=1337}){
  assertSwarmEnabled();
  if(chainId!==1337)throw new Error('Owned-validator preparation is restricted to chain1337');
  if(![sender,payer,target].every(a=>ADDRESS.test(a)&&!/^0x0{40}$/i.test(a))||new Set([sender,payer,target].map(a=>a.toLowerCase())).size!==3)throw new Error('Distinct owned sender, payer and action addresses required');
  if(!Number.isSafeInteger(nonce)||nonce<0)throw new Error('Invalid isolated nonce');
  return newTx({chainId,sender,nonceSeq:BigInt(nonce),frames:[
    frame(profile,'VERIFY',{scope:'EXECUTION',target:null,execution:40000n}),
    frame(profile,'VERIFY',{scope:'PAYMENT',target:payer,execution:50000n}),
    frame(profile,'SENDER',{target,execution:150000n,state:200000n,data}),
  ],signatures:[{scheme:0,signer:'0x',msg:'0x',signature:'0x'+'00'.repeat(65)}],fees:{maxFeePerGas:2000000000n}});
}
export async function prepareAuthorizationPair({fixture,ownerAccount,sender,payer,target,nonce=0,mutation}){
  if(!['unsafe','safe'].includes(fixture))throw new Error('Unknown owned validator fixture');
  const authorized=unsignedValidatorTransaction({sender,payer,target,nonce,data:mutation.authorized.data});
  const digest=tx=>fixture==='safe'?workshopSigningHash(tx):unsafeIntentHash({chainId:1337,sender,nonce,target:tx.frames[2].target});
  const ownerDigest=digest(authorized),witness=await ownerAccount.sign({hash:ownerDigest});
  if(!/^0x[\da-f]{130}$/i.test(witness))throw new Error('Owner witness must be canonical65-byte r||s||v');
  authorized.signatures[0].signature=witness;
  const tampered=structuredClone(authorized);tampered.frames[2].data=mutation.tampered.data;
  const baselineSigner=await recoverAddress({hash:digest(authorized),signature:witness});
  const tamperedSigner=await recoverAddress({hash:digest(tampered),signature:witness});
  const owner=ownerAccount.address.toLowerCase();
  const encode=tx=>({transaction:tx,raw:encodeTx(profile,tx),wire:toWire(tx),computedHash:txHash(profile,tx),canonicalHash:workshopSigningHash(tx)});
  const a=encode(authorized),b=encode(tampered);
  if(encodeTx(profile,decodeTx(profile,a.raw))!==a.raw)throw new Error('Frame transaction roundtrip failed');
  return {fixture,owner:ownerAccount.address,sender,nonce,hashProfile:WORKSHOP_HASH,liveHashCompatibility:'UNVERIFIED',ownerDigest,
    authorized:a,tampered:b,invariants:{sameWitness:authorized.signatures[0].signature===tampered.signatures[0].signature,sameTarget:authorized.frames[2].target===tampered.frames[2].target,
      canonicalHashChanged:a.canonicalHash!==b.canonicalHash,authorizedOwnerRecovered:baselineSigner.toLowerCase()===owner,tamperedOwnerRecovered:tamperedSigner.toLowerCase()===owner},
    classification:'OFFLINE_CRYPTOGRAPHIC_CHECK — NO CONTRACT OR EIP-8141 EXECUTION'};
}
