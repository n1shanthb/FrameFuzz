import {decodeTx} from '@forshtat/hegota-support/tx';
import {decodeEventLog,decodeFunctionData,decodeAbiParameters,encodeFunctionData,keccak256,parseAbi} from 'viem';
import {profile} from '../adapters/workshop-codec.mjs';
export const RAW_ACTION_PROFILE='ethrex-9aa364-owned-recorder-candidate-v1';
export const RECORDER_ABI=parseAbi(['function record(uint256 operation,uint256 parameter)','function actions(address) view returns(uint256 operation,uint256 parameter,uint256 count)','event ActionRecorded(address indexed caller,uint256 operation,uint256 parameter,uint256 count)']);
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.toLowerCase()===b.toLowerCase();
const hash=x=>/^0x[\da-f]{64}$/i.test(x??'');
const addr=x=>/^0x[\da-f]{40}$/i.test(x??'');
const requireThat=(ok,message)=>{if(!ok)throw new Error(message);};

/** Offline consistency only. No canonical RPC collector or deployed owned-action receipt exists.
 * Never turns a caller-supplied boolean, client label, or constructed bundle into LIVE proof. */
export function ingestRawActionProof(bundle){
  const base={schema:'framefuzz.raw-action-verification.v1',actionEvidenceVerified:false,authorizationVerified:false,liveVerified:false,finding:false};
  try{
    requireThat(bundle&&Object.keys(bundle).every(k=>['schema','profile','chainId','client','expected','raw','receipt','block','priorBlock','state','evidenceClass'].includes(k)),'Unsupported proof fields; normalized proof booleans are not evidence');
    requireThat(bundle.schema==='framefuzz.raw-action-bundle.v1'&&bundle.profile===RAW_ACTION_PROFILE,'Unsupported raw receipt profile');
    requireThat(bundle.chainId===1337&&typeof bundle.client==='string'&&bundle.client.includes('9aa3645d795945c64400f41a70aace0edfa7f383'),'Unsupported chain/client');
    requireThat(['CONSTRUCTED_TEST','CAPTURED_RPC_UNATTESTED'].includes(bundle.evidenceClass),'Unattested bundle cannot assert LIVE provenance');
    const {expected:e,receipt:r,block:b,priorBlock:prior,state}=bundle;
    requireThat(e&&Object.keys(e).every(k=>['sender','payer','action','nonceSeq','operation','parameter','frameIndex','path'].includes(k)),'Unsupported expected-action fields');
    requireThat([e.sender,e.payer,e.action].every(addr)&&new Set([e.sender,e.payer,e.action].map(x=>x.toLowerCase())).size===3&&e.path==='sponsored'&&e.frameIndex===2,'Unsupported sender/payer/frame relationship');
    requireThat([e.operation,e.parameter,e.nonceSeq].every(x=>typeof x==='string'&&/^(0|[1-9]\d{0,76})$/.test(x)),'Expected values require canonical decimal quantities');
    const tx=decodeTx(profile,bundle.raw),txHash=keccak256(bundle.raw);
    requireThat(Number(tx.chainId)===1337&&equal(tx.sender,e.sender)&&String(tx.nonceSeq)===e.nonceSeq,'Transaction chain/sender/nonce mismatch');
    requireThat(tx.nonceKeys.length===1&&BigInt(tx.nonceKeys[0])===0n,'Unsupported keyed nonce layout');
    requireThat(tx.signatures.length===1&&tx.signatures[0].scheme===0&&tx.signatures[0].signer==='0x'&&tx.signatures[0].msg==='0x'&&/^0x[\da-f]{130}$/i.test(tx.signatures[0].signature),'Unsupported witness structure; no authorization inferred');
    requireThat(tx.frames.length===3&&tx.frames.every(f=>BigInt(f.value)===0n),'Unsupported frame count/value');
    const [verify,payment,action]=tx.frames;
    requireThat(verify.mode===1&&verify.flags===2&&(verify.target===null||equal(verify.target,e.sender))&&payment.mode===1&&payment.flags===1&&equal(payment.target,e.payer)&&action.mode===2&&action.flags===0&&equal(action.target,e.action),'Wrong frame target/mode/payer');
    const call=decodeFunctionData({abi:RECORDER_ABI,data:action.data});
    requireThat(call.functionName==='record'&&String(call.args[0])===e.operation&&String(call.args[1])===e.parameter,'Wrong action calldata');
    requireThat(r&&hash(r.transactionHash)&&equal(r.transactionHash,txHash)&&equal(r.from,e.sender)&&equal(r.payer,e.payer),'Receipt hash/account/payer mismatch');
    requireThat(hash(b?.hash)&&equal(r.blockHash,b.hash)&&/^0x[\da-f]+$/i.test(b.number??'')&&r.blockNumber===b.number,'Receipt block mismatch');
    requireThat(Array.isArray(b.transactions)&&equal(b.transactions.at(-1),txHash),'Require last transaction in supplied block for post-state interpretation');
    requireThat(hash(prior?.hash)&&equal(b.parentHash,prior.hash)&&BigInt(prior.number)+1n===BigInt(b.number),'Missing contiguous pre-state block');
    requireThat(r.status==='0x1','Outer transaction reverted or status unknown');
    requireThat(Array.isArray(r.frameReceipts)&&r.frameReceipts.length===3,'Missing or unsupported individual frame receipts');
    requireThat(r.frameReceipts.every(f=>f?.status==='0x1'),'Missing/reverted verification or action frame; no authorization conclusion');
    const logs=r.frameReceipts[2].logs;
    requireThat(Array.isArray(logs)&&logs.length===1&&Array.isArray(r.logs)&&r.logs.length===1,'Missing or ambiguous action log');
    const log=logs[0],outer=r.logs[0];
    requireThat(equal(log.address,e.action)&&equal(outer.address,e.action)&&log.removed===false&&outer.removed===false,'Wrong emitter or removed log');
    for(const item of [log,outer])requireThat(equal(item.transactionHash,txHash)&&equal(item.blockHash,b.hash)&&item.blockNumber===b.number,'Log context mismatch');
    requireThat(log.data===outer.data&&JSON.stringify(log.topics)===JSON.stringify(outer.topics)&&log.logIndex===outer.logIndex,'Frame and outer log disagree');
    const event=decodeEventLog({abi:RECORDER_ABI,data:log.data,topics:log.topics,strict:true});
    requireThat(event.eventName==='ActionRecorded'&&equal(event.args.caller,e.sender)&&String(event.args.operation)===e.operation&&String(event.args.parameter)===e.parameter,'Event caller/parameters mismatch');
    const data=encodeFunctionData({abi:RECORDER_ABI,functionName:'actions',args:[e.sender]});
    const read=(observation,blockHash)=>{requireThat(observation&&observation.method==='eth_call'&&equal(observation.to,e.action)&&equal(observation.blockHash,blockHash)&&observation.data===data,'State observation identity/block mismatch');return decodeAbiParameters([{type:'uint256'},{type:'uint256'},{type:'uint256'}],observation.result);};
    const before=read(state?.before,prior.hash),after=read(state?.after,b.hash);
    requireThat(String(after[0])===e.operation&&String(after[1])===e.parameter&&after[2]===before[2]+1n&&after[2]===event.args.count,'Inconsistent action state/count');
    return {...base,status:'CONSISTENT_RAW_BUNDLE_UNATTESTED',rawActionConsistent:true,transactionHash:txHash,frameIndex:2,
      evidenceClass:bundle.evidenceClass,assumptions:['Caller-supplied block/receipt/state RPC responses are not cryptographic or canonical-chain attestation','Candidate owned-recorder log schema has no actual owned-validator live capture','Exact authorization rejection traces are unsupported; no safe rejection inferred']};
  }catch(error){return {...base,status:'INCONCLUSIVE',rawActionConsistent:false,reason:error.message};}
}
