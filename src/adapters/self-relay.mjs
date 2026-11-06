import {frame,newTx,secp256k1Placeholder,signTx,encodeTx,decodeTx,txHash,sigHash} from '@forshtat/hegota-support/tx';
import {toWire} from '@forshtat/hegota-support/rpc';
import {privateKeyToAccount} from 'viem/accounts';
import {keccak256} from 'viem';
import {profile} from './workshop-codec.mjs';

export const SELF_RELAY_PROFILE='ethrex-eip8141-tracer';
export const SELF_RELAY_MAX_FEE_WEI=500000000000000n;
const ADDRESS=/^0x[0-9a-f]{40}$/i,KEY=/^0x[0-9a-f]{64}$/i;

/** Pure offline signing. The private key never enters the returned candidate. */
export async function prepareSelfRelayCandidate({privateKey,recipient,nonce=0,sourceDigest=null,analysisId=null}={}){
 if(!KEY.test(privateKey??''))throw Error('FRAMEFUZZ_SENDER_KEY must be a devnet-only 32-byte environment key');
 if(!ADDRESS.test(recipient??'')||!Number.isSafeInteger(nonce)||nonce<0)throw Error('Invalid recipient or pending sender nonce');
 const sender=privateKeyToAccount(privateKey).address;
 const unsigned=newTx({chainId:1337,sender,nonceSeq:BigInt(nonce),
  frames:[frame(profile,'VERIFY',{scope:'EXECUTION_AND_PAYMENT',target:null,execution:30000n}),
   frame(profile,'SENDER',{target:recipient,execution:50000n,data:'0x',value:0n})],
  signatures:[secp256k1Placeholder(profile)],fees:{maxFeePerGas:2000000000n}});
 const signed=await signTx(profile,unsigned,privateKey),raw=encodeTx(profile,signed),wire=toWire(signed);
 if(encodeTx(profile,decodeTx(profile,raw))!==raw)throw Error('Pinned codec roundtrip failed');
 if(signed.frames.length!==2||signed.frames[0].flags!==3||signed.signatures[0].scheme!==1||signed.signatures[0].msg!=='0x')throw Error('Unexpected self-relay envelope');
 const wireBytes=BigInt((raw.length-2)/2),gasUpperBound=12000n+2n*475n+80000n+64n*wireBytes;
 const maxFeeWei=gasUpperBound*2000000000n;
 if(maxFeeWei>SELF_RELAY_MAX_FEE_WEI)throw Error('Self-relay fee cap exceeded');
 const hash=txHash(profile,signed);if(keccak256(raw)!==hash)throw Error('Signed transaction identity mismatch');
 return {schema:'framefuzz.self-relay-candidate.v1',classification:'OFFLINE_SIGNED_UNFUNDED_CANDIDATE',chainId:1337,
  sourceDigest,analysisId,sourceParticipation:'INFRASTRUCTURE_ONLY_NO_PASTED_CONTRACT',profile:SELF_RELAY_PROFILE,
  sender,payer:sender,recipient,nonceKeys:['0'],nonceSeq:String(nonce),frames:wire.frames,signature:wire.signatures[0],
  signatureHash:sigHash(profile,signed),transactionHash:hash,raw,wire,
  fee:{maxFeePerGasWei:'2000000000',gasUpperBound:String(gasUpperBound),maxFeeWei:String(maxFeeWei),fundingCapWei:String(SELF_RELAY_MAX_FEE_WEI),verificationGas:30000,actionGas:50000,signatureVerificationGas:2800,maxVerifyGas:100000},
  requests:{public:{endpoint:'https://altmempool.forshtat.com/rpc',method:'eth_sendRawTransaction',params:[raw]},
   alternative:{endpoint:'https://altmempool.forshtat.com',method:'eth_sendFrameTransaction',params:[wire]}},
  observed:{public:null,alternative:null},submissionPlan:{ordering:'PUBLIC_THEN_ALTERNATIVE_OR_CONCURRENT_AFTER_APPROVAL',timestamps:'CAPTURE_AT_ACTUAL_SUBMISSION',duplicatePolicy:'KNOWN_OR_DUPLICATE_IS_INCONCLUSIVE',receiptMethods:['eth_getTransactionReceipt','eth_getFrameTransactionReceipt'],receiptQueries:'Query public canonical receipt and sidecar frame receipt after submission; verify matching hash and canonical block'},
  broadcasts:0,warning:'Offline signed bytes only. Read-only checks cannot prove admission, runtime signing compatibility or future nonce/funding state.'};
}
