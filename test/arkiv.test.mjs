import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createPublicClient} from '@arkiv-network/sdk';
import {rabdi} from '@arkiv-network/sdk/chains';
import {custom,stringToHex} from 'viem';
import {buildRegressionCase,validateRegressionCase,contentDigest} from '../src/arkiv/case.mjs';
import {createRegistry} from '../src/arkiv/registry.mjs';
import {createDashboardServer} from '../src/server.mjs';
import {toReplay,toMarkdown} from '../src/reports.mjs';

const report=JSON.parse(await readFile(new URL('../evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json',import.meta.url)));
const writer='0x1111111111111111111111111111111111111111',other='0x2222222222222222222222222222222222222222',key='0x'+'ab'.repeat(32);
const make=()=>buildRegressionCase({report,publisher:writer,expirationBlocks:1000,expiresAtBlock:2000n});
function fixture(record=make()){
  const values={caseVersion:1n,suite:record.suite,family:record.mutationFamily,ruleId:record.ruleId,implementation:record.implementationVersion,publisher:record.publisher,classification:record.evidence.classification,contentDigest:record.contentDigest,expiresAtBlock:BigInt(record.expiration.expiresAtBlock),record:stringToHex(JSON.stringify(record))};
  const row={$key:key,$owner:other,$creator:writer,$expiresAt:BigInt(record.expiration.expiresAtBlock)};
  for(const [k,v]of Object.entries(values))row[k]={value:v};
  return {row,values};
}
function mocked(record=make()){
  let block=1000n,chain=7794095,fetches=0;
  const {row}=fixture(record),calls=[];
  const query={from(){return this;},where(x){calls.push(x);return this;},limit(){return this;},ownedBy(x){calls.push(x);return this;},toString(){return 'mock SDK query';},async fetch(){return {entities:[row]};}};
  const publicClient={getChainId:async()=>chain,getBlockTiming:async()=>({currentBlock:block}),select:()=>query,getEntity:async()=>{fetches++;return row;},getTransactionReceipt:async({hash})=>({status:'success',transactionHash:hash})};
  return {publicClient,row,calls,setBlock:n=>block=n,setChain:n=>chain=n,fetches:()=>fetches};
}
test('publisher projection excludes raw signatures, local paths, credentials and arbitrary metadata',()=>{
  const original=structuredClone(report);original.privateKey='SECRET_DO_NOT_PUBLISH';original.results[0].description='SECRET_DO_NOT_PUBLISH';
  const record=buildRegressionCase({report:original,publisher:writer,expirationBlocks:1000,expiresAtBlock:2000n});
  const serialized=JSON.stringify(record);assert(!serialized.includes('SECRET_DO_NOT_PUBLISH'));assert(!serialized.includes('signedRaw'));assert(!serialized.includes('evidence/mutations'));assert(!serialized.includes('https://'));assert.equal(record.reproduction.definition.ruleModel.provenance.confidence,'UNKNOWN');assert.equal(record.originalOutcomes.public.confidence,'VERIFIED');assert.equal(record.evidence.classification,'LIVE');
});
test('digest, schema and semantic tampering fail closed even with a recomputed content digest',()=>{
  const r=make();r.semanticParameters.value++;assert.throws(()=>validateRegressionCase(r),/digest/);r.contentDigest=contentDigest(r);assert.throws(()=>validateRegressionCase(r),/semantic/);
  const s=make();s.privateKey='secret';s.contentDigest=contentDigest(s);assert.throws(()=>validateRegressionCase(s),/unsupported/);
  const t=make();t.reproduction.definition.ruleModel.provenance.evidence=[{file:'private.env'}];t.contentDigest=contentDigest(t);assert.throws(()=>validateRegressionCase(t),/unsupported/);
});
test('query crosses owners, quarantines invalid metadata, and excludes expired entities',async()=>{
  const m=mocked(),r=createRegistry({publicClient:m.publicClient,readerAddress:null});
  assert.equal((await r.query({suite:'verification-gas',ruleId:'MAX_VERIFY_GAS',implementation:make().implementationVersion})).cases[0].owner,other);
  m.row.contentDigest.value='tampered';assert.equal((await r.query()).rejected.length,1);m.row.contentDigest.value=make().contentDigest;
  m.setBlock(2000n);assert.equal((await r.query()).cases.length,0);await assert.rejects(r.fetch(key),/expired/);await assert.rejects(r.importPreview(key),/expired/);
});

test('bounded registry discovery explicitly reports possible truncation',async()=>{
  const m=mocked(),r=createRegistry({publicClient:m.publicClient,readerAddress:null});
  const result=await r.query({limit:1});
  assert.equal(result.discovery.possiblyTruncated,true);
  assert.equal(result.discovery.paginationSupported,false);
  assert.equal((await r.query({limit:20})).discovery.possiblyTruncated,false);
});
test('creator binding, network isolation and filter validation are enforced',async()=>{
  const m=mocked(),r=createRegistry({publicClient:m.publicClient,readerAddress:null});m.row.$creator=other;await assert.rejects(r.fetch(key),/creator/);m.setChain(1337);await assert.rejects(r.query(),/7794095/);m.setChain(7794095);await assert.rejects(r.query({suite:"x' OR 1"}),/Invalid/);await assert.rejects(r.query({limit:100}),/limit/);await assert.rejects(r.fetch('bad'),/32-byte/);
});
test('import freshly retrieves and regenerates unsigned semantics without transport or signing',async()=>{
  const m=mocked(),r=createRegistry({publicClient:m.publicClient,readerAddress:null});
  const a=await r.importPreview(key),b=await r.importPreview(key);assert.equal(m.fetches(),2);assert.equal(a.preview.submissions,0);assert.equal(b.preview.results.length,1);assert.match(a.preview.source,/PREVIEW_COMMUNITY/);assert.equal(a.preview.results[0].mutation.unsignedModel.verificationGasLimit,67198);assert.equal(a.preview.communityOrigin.originalOutcomes.public.receipt.state,'included_success');assert.equal(a.preview.results[0].paths[0].oracle.confidence,'UNKNOWN');assert(!JSON.stringify(a.preview.results).includes('signedRaw'));
  assert(!a.preview.results[0].reproduction.cli.includes('--submit'));assert.equal(toReplay(a.preview).communityOrigin.entityKey,key);assert.match(toMarkdown(a.preview),/historical publisher claims/);
});
test('publish requires a distinct Rabdi wallet, explicit submission and successful receipt',async()=>{
  const m=mocked();let calls=0;
  const wallet={account:{address:writer},chain:{id:7794095},async createEntity(schema,values,options){calls++;assert.equal(schema.name,'framefuzz.regression.v1');assert.equal(values.publisher.value,writer);assert.equal(options.flags.readonly,true);return {entityKey:key,txHash:key,expiresAt:2000n};}};
  const r=createRegistry({publicClient:m.publicClient,walletClient:wallet,readerAddress:null});
  await assert.rejects(r.publish({report}),/submit/);assert.equal(calls,0);assert.equal((await r.publish({report,expirationBlocks:1000,submit:true})).entityKey,key);assert.equal(calls,1);
  wallet.chain.id=1337;await assert.rejects(r.publish({report,submit:true}),/Rabdi/);
});
test('official SDK fetch uses mocked JSON-RPC transport and validates the typed onchain row',async()=>{
  const {values}=fixture(),methods=[];
  const attributes=[{name:'arkiv.schema',type:'str',value:'framefuzz.regression.v1'},...Object.entries(values).map(([name,value])=>({name,type:['caseVersion','expiresAtBlock'].includes(name)?'u64':name==='publisher'?'addr':name==='record'?'bytes':'str',value:typeof value==='bigint'?'0x'+value.toString(16):value}))];
  const rpcEntity={key,owner:other,creator:writer,createdAt:'0x1',updatedAt:'0x1',expiresAt:'0x7d0',creationFlags:1,attributeSchema:attributes.map(a=>({name:a.name,type:a.type,indexed:a.name!=='record'})),attributes};
  const publicClient=createPublicClient({chain:rabdi({accessKey:''}),transport:custom({async request({method,params}){methods.push(method);if(method==='eth_chainId')return '0x76edaf';if(method==='arkiv_getBlockTiming')return {current_block:'0x3e8',current_block_time:1,duration:2};if(method==='arkiv_getEntity')return rpcEntity;if(method==='arkiv_query'){assert.match(params[0],/arkiv.schema/);assert.match(params[0],/suite = str\('verification-gas'\)/);assert.match(params[0],/ruleId/);assert.match(params[0],/implementation/);return {data:[rpcEntity],blockNumber:'0x3e8'};}throw new Error('Unexpected RPC '+method);}})});
  const r=createRegistry({publicClient,readerAddress:null});assert.equal((await r.fetch(key)).record.contentDigest,make().contentDigest);assert.deepEqual(methods,['eth_chainId','arkiv_getBlockTiming','arkiv_getEntity']);
  assert.equal((await r.query({suite:'verification-gas',ruleId:'MAX_VERIFY_GAS',implementation:make().implementationVersion})).cases[0].record.seed,42);assert(methods.includes('arkiv_query'));
});
test('dashboard exposes direct registry reads and import but rejects community broadcast overrides',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'framefuzz-arkiv-')),m=mocked(),registry=createRegistry({publicClient:m.publicClient,readerAddress:null});
  const server=createDashboardServer({resultDir:dir,communityRegistry:registry});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
  try{assert.equal((await (await fetch(base+'/api/community?suite=verification-gas')).json()).cases.length,1);
    assert.equal((await (await fetch(base+'/api/community/case?key='+key)).json()).creator,writer);
    const no=await fetch(base+'/api/community/import',{method:'POST',body:JSON.stringify({key,submit:true})});assert.equal(no.status,400);
    const ok=await fetch(base+'/api/community/import',{method:'POST',body:JSON.stringify({key})});const d=await ok.json();assert.equal(ok.status,200);assert.equal(d.submissions,0);assert.match(d.source,/PREVIEW/);
    const saved=JSON.parse(await readFile(path.join(dir,d.file)));assert.equal(saved.communityOrigin.entityKey,key);
  }finally{await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
