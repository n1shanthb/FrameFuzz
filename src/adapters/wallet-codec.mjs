import {encodeFunctionData} from 'viem';
import {frame,newTx,secp256k1Placeholder,signTx,encodeTx,decodeTx,txHash} from '@forshtat/hegota-support/tx';
import {toWire} from '@forshtat/hegota-support/rpc';
import {keccak256} from 'viem';
import {profile} from './workshop-codec.mjs';
import {EF_CANONICAL_ENDPOINT,EF_ALTERNATIVE_ENDPOINT} from './ef-routing.mjs';

export const STAKING_REGISTRY='0xd51c04d7a0b01124e84de152f4e56d9eecb22d2f';
export const WORKSHOP_RECIPIENT='0x8943545177806ED17B9F23F0a21ee5948eCaa776';
export const STAKE_WEI=12000000000000000n; // 0.012 ETH (> minStake 0.01)
export const UNSTAKE_DELAY_SEC=86400;
export const WALLET_FUNDING_WEI=30000000000000000n; // 0.03 ETH creation value
const ADD_STAKE_ABI=[{type:'function',name:'addStake',stateMutability:'payable',inputs:[{type:'uint32'}],outputs:[]}];
const ADDRESS=/^0x[0-9a-fA-F]{40}$/;
const KEY=/^0x[0-9a-fA-F]{64}$/;

/** Workshop buildWalletTx: VERIFY(both) on wallet + SENDER transfer. Nonempty verifyData triggers FOREIGN storage read. */
export function buildWalletTransaction({wallet,owner,to=WORKSHOP_RECIPIENT,value=1n,nonce,chainId=1337,maxFeePerGas=2000000000n,verifyData='0x01'}){
  if(chainId!==1337)throw Error('Wallet codec restricted to chain 1337');
  if(![wallet,owner,to].every(a=>ADDRESS.test(a)))throw Error('Invalid wallet/owner/recipient');
  if(!Number.isSafeInteger(nonce)||nonce<0)throw Error('Invalid wallet nonce');
  return newTx({
    chainId,sender:wallet,nonceSeq:BigInt(nonce),
    signatures:[secp256k1Placeholder(profile,owner)],
    fees:{maxFeePerGas},
    frames:[
      frame(profile,'VERIFY',{scope:'EXECUTION_AND_PAYMENT',target:null,execution:70000n,data:verifyData}),
      frame(profile,'SENDER',{target:to,execution:50000n,state:200000n,value}),
    ],
  });
}

/** Clean VERIFY + SENDER addStake so the wallet itself is the staked entity. */
export function buildStakeTransaction({wallet,owner,registry=STAKING_REGISTRY,amount=STAKE_WEI,unstakeDelaySec=UNSTAKE_DELAY_SEC,nonce,chainId=1337,maxFeePerGas=2000000000n}){
  if(chainId!==1337)throw Error('Stake codec restricted to chain 1337');
  if(![wallet,owner,registry].every(a=>ADDRESS.test(a)))throw Error('Invalid stake addresses');
  if(!Number.isSafeInteger(nonce)||nonce<0)throw Error('Invalid wallet nonce');
  return newTx({
    chainId,sender:wallet,nonceSeq:BigInt(nonce),
    signatures:[secp256k1Placeholder(profile,owner)],
    fees:{maxFeePerGas},
    frames:[
      frame(profile,'VERIFY',{scope:'EXECUTION_AND_PAYMENT',target:null,execution:70000n}),
      frame(profile,'SENDER',{target:registry,execution:150000n,state:300000n,value:amount,
        data:encodeFunctionData({abi:ADD_STAKE_ABI,functionName:'addStake',args:[unstakeDelaySec]})}),
    ],
  });
}

export async function signWalletCandidate({privateKey,wallet,owner,nonce,verifyData='0x01',sourceDigest=null,analysisId=null,mutation='FOREIGN.staticcall during VERIFY',to=WORKSHOP_RECIPIENT,value=1n}){
  if(!KEY.test(privateKey??''))throw Error('Owner private key required');
  const unsigned=buildWalletTransaction({wallet,owner,to,value,nonce,verifyData});
  const signed=await signTx(profile,unsigned,privateKey);
  const raw=encodeTx(profile,signed),wire=toWire(signed),hash=txHash(profile,signed);
  if(encodeTx(profile,decodeTx(profile,raw))!==raw)throw Error('Pinned wallet codec roundtrip failed');
  if(keccak256(raw).toLowerCase()!==hash.toLowerCase())throw Error('Signed wallet identity mismatch');
  return {
    schema:'framefuzz.wallet-policy-candidate.v1',
    mutation,
    chainId:1337,
    sourceDigest,
    analysisId,
    wallet,
    owner,
    nonce,
    verifyData,
    hash,
    raw,
    wire,
    requests:{
      public:{endpoint:EF_CANONICAL_ENDPOINT,method:'eth_sendRawTransaction',params:[raw]},
      alternative:{endpoint:EF_ALTERNATIVE_ENDPOINT,method:'eth_sendFrameTransaction',params:[wire]},
    },
    broadcasts:0,
  };
}
