import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeTx} from '@forshtat/hegota-support/tx';
import {encodeAbiParameters,encodeFunctionData,encodeEventTopics,keccak256} from 'viem';
import {unsignedValidatorTransaction} from '../src/adapters/sender-validator.mjs';
import {profile} from '../src/adapters/workshop-codec.mjs';
import {ingestRawActionProof,RECORDER_ABI,RAW_ACTION_PROFILE} from '../src/swarm/raw-action-proof.mjs';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import path from 'node:path';
import {execFile} from 'node:child_process';import {promisify} from 'node:util';
process.env.FRAMEFUZZ_SWARM='on';
const address=n=>'0x'+String(n).repeat(40),hash=n=>'0x'+String(n).repeat(64);
function constructed(){
  const sender=address(1),payer=address(2),action=address(3),data=encodeFunctionData({abi:RECORDER_ABI,functionName:'record',args:[2n,10n]});
  // Dummy unsigned witness: fixture tests parsing, not signing or chain execution.
  const raw=encodeTx(profile,unsignedValidatorTransaction({sender,payer,target:action,data,nonce:7})),txHash=keccak256(raw);
  const log={address:action,transactionHash:txHash,blockHash:hash(4),blockNumber:'0x2',logIndex:'0x0',removed:false,
    topics:encodeEventTopics({abi:RECORDER_ABI,eventName:'ActionRecorded',args:{caller:sender}}),
    data:encodeAbiParameters([{type:'uint256'},{type:'uint256'},{type:'uint256'}],[2n,10n,1n])};
  const observation=(blockHash,values)=>({method:'eth_call',to:action,blockHash,data:encodeFunctionData({abi:RECORDER_ABI,functionName:'actions',args:[sender]}),result:encodeAbiParameters([{type:'uint256'},{type:'uint256'},{type:'uint256'}],values)});
  return {schema:'framefuzz.raw-action-bundle.v1',profile:RAW_ACTION_PROFILE,evidenceClass:'CONSTRUCTED_TEST',chainId:1337,client:'ethrex/9aa3645d795945c64400f41a70aace0edfa7f383',raw,
    expected:{sender,payer,action,nonceSeq:'7',operation:'2',parameter:'10',frameIndex:2,path:'sponsored'},
    block:{hash:hash(4),number:'0x2',parentHash:hash(5),transactions:[txHash]},priorBlock:{hash:hash(5),number:'0x1'},
    receipt:{transactionHash:txHash,from:sender,payer,status:'0x1',blockHash:hash(4),blockNumber:'0x2',logs:[structuredClone(log)],frameReceipts:[{status:'0x1',logs:[]},{status:'0x1',logs:[]},{status:'0x1',logs:[log]}]},
    state:{before:observation(hash(5),[0n,0n,0n]),after:observation(hash(4),[2n,10n,1n])}};
}
test('constructed raw receipt/event/state consistency never becomes live action proof',async()=>{
  const r=ingestRawActionProof(constructed());assert.equal(r.rawActionConsistent,true,r.reason);assert.equal(r.actionEvidenceVerified,false);assert.equal(r.authorizationVerified,false);assert.equal(r.liveVerified,false);assert.equal(r.finding,false);
  const directory=await mkdtemp(path.join(tmpdir(),'framefuzz-raw-proof-'));
  try{
    const input=path.join(directory,'constructed.json'),output=path.join(directory,'checked.json');await writeFile(input,JSON.stringify(constructed()));
    await promisify(execFile)(process.execPath,['bin/framefuzz.mjs','swarm','verify-action','--bundle',input,'--output',output]);
    const cli=JSON.parse(await readFile(output));assert.equal(cli.rawActionConsistent,true);assert.equal(cli.actionEvidenceVerified,false);assert.equal(cli.finding,false);
  }finally{await rm(directory,{recursive:true,force:true});}
});
const badCases={
  'forged emitter':b=>b.receipt.frameReceipts[2].logs[0].address=address(9),
  'wrong event caller':b=>{const topics=encodeEventTopics({abi:RECORDER_ABI,eventName:'ActionRecorded',args:{caller:address(9)}});b.receipt.logs[0].topics=topics;b.receipt.frameReceipts[2].logs[0].topics=topics;},
  'wrong calldata expectation':b=>b.expected.parameter='11',
  'wrong frame':b=>b.expected.frameIndex=1,
  'wrong payer':b=>b.receipt.payer=address(9),
  'wrong sender':b=>b.receipt.from=address(9),
  'wrong nonce':b=>b.expected.nonceSeq='8',
  'wrong chain':b=>b.chainId=1,
  'wrong hash':b=>b.receipt.transactionHash=hash(9),
  'inconsistent state':b=>b.state.after.result=b.state.before.result,
  'missing receipts':b=>delete b.receipt.frameReceipts,
  'reverted action':b=>b.receipt.frameReceipts[2].status='0x0',
  'outer revert':b=>b.receipt.status='0x0',
  'wrong block':b=>b.block.hash=hash(9),
  'unsupported client':b=>b.client='other-client',
  'synthetic verified boolean':b=>b.actionEvidenceVerified=true,
  'claimed live source':b=>b.evidenceClass='LIVE_EIP8141',
  'ambiguous logs':b=>b.receipt.logs.push(b.receipt.logs[0]),
};
for(const [name,mutate]of Object.entries(badCases))test('raw proof rejects '+name,()=>{const b=constructed();mutate(b);const r=ingestRawActionProof(b);assert.equal(r.status,'INCONCLUSIVE');assert.equal(r.actionEvidenceVerified,false);assert.equal(r.finding,false);});
