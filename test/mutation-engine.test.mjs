import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {generateMutations,mutationDefinition,regenerateMutation,minimizeBoundary} from '../src/mutations/generator.mjs';
import {expectation,compareMutation} from '../src/mutations/oracle.mjs';
import {runMutationCampaign,loadMutationDefinition} from '../src/mutations/campaign.mjs';
import {createAdapter} from '../src/adapters/index.mjs';
import {workshopPlugin} from '../src/adapters/workshop-live.mjs';
import {RpcResponseError} from '../src/rpc.mjs';
import {decodeTx} from '@forshtat/hegota-support/tx';
import {profile} from '../src/adapters/workshop-codec.mjs';

const rules=JSON.parse(await readFile('rules/devnet-1337.v1.json','utf8'));
const config=JSON.parse(await readFile('examples/live/devnet.json','utf8'));
const def=(extra={})=>mutationDefinition({rules,...extra});

test('same seed regenerates the identical semantic sequence and descriptors',()=>{
  const a=generateMutations(def()),b=generateMutations(def());assert.deepEqual(a,b);
  for(const v of a)assert.deepEqual(regenerateMutation(v.descriptor),v);
  assert.deepEqual(a.map(v=>v.parameter.value).sort((a,b)=>a-b),[67190,67198,67199,67200,67201,67202,67210]);
});
test('different seeds change sampled values beyond the boundary anchor set',()=>{
  const a=generateMutations(def({seed:1,count:20})),b=generateMutations(def({seed:2,count:20}));
  assert.notDeepEqual(a.map(v=>v.parameter.value).sort(),b.map(v=>v.parameter.value).sort());
  assert.equal(new Set(a.map(v=>v.parameter.value)).size,20);
});
test('verified total gas model derives below/at/above without per-value expectations',()=>{
  for(const v of generateMutations(def()))for(const p of ['public','alt']){
    assert.equal(v.oracle[p].expected,v.parameter.value+30000+2800<=100000?'accepted':'rejected');
    assert.equal(v.oracle[p].components.total,v.parameter.value+32800);assert.equal(v.oracle[p].confidence,'VERIFIED');
  }
});
test('insufficient validation gas is a precondition; acceptance below evidenced sufficient floor is inferred',()=>{
  const setup={staked:false,configuration:{kind:'basic'}};
  const low=expectation({verificationGasLimit:100,poolRead:false},setup,'alt',rules);
  assert.equal(low.expected,null);assert.equal(compareMutation(low,{status:'accepted'}).verdict,'PRECONDITION_FAILURE');
  const inferred=expectation({verificationGasLimit:20000,poolRead:false},setup,'alt',rules);
  assert.equal(inferred.confidence,'INFERRED');assert.equal(compareMutation(inferred,{status:'rejected',message:'other rule'}).verdict,'INCONCLUSIVE');
});
test('nonce, funds, malformed input and out-of-gas never become mutation policy bugs',()=>{
  const oracle=generateMutations(def())[0].oracle.alt;
  for(const message of ['nonce too low','insufficient funds','invalid signature','validation frame ran out of gas'])assert.equal(compareMutation(oracle,{status:'rejected',message}).verdict,'PRECONDITION_FAILURE');
  assert.equal(compareMutation(oracle,{status:'inconclusive',errorClass:'adapter_setup',message:'stake changed'}).verdict,'PRECONDITION_FAILURE');
  assert.equal(compareMutation(oracle,{status:'transport_failure',message:'offline'}).verdict,'TRANSPORT_FAILURE');
});
test('one storage specification generates three setup states and intentional path divergence',()=>{
  const variants=generateMutations(def({suite:'uniswap-storage',count:3}));
  assert.deepEqual(variants.map(v=>v.setup.configuration.kind).sort(),['basic','staked','unstaked']);
  const staked=variants.find(v=>v.setup.staked);assert.equal(staked.unsignedModel.poolRead,true);assert.equal(staked.oracle.public.expected,'rejected');assert.equal(staked.oracle.alt.expected,'accepted');
  const unstaked=variants.find(v=>v.setup.configuration.kind==='unstaked');assert.equal(unstaked.oracle.alt.expected,'rejected');assert.equal(unstaked.setup.staked,false);
});
test('unsupported dimensions, unsafe counts, credentials and malformed seeds are rejected',()=>{
  for(const d of [ {...def(),seed:-1},{...def(),count:0},{...def(),operation:{type:'flip-signed-byte'}},{...def(),paths:['mainnet']},{...def(),baseTemplate:{...def().baseTemplate,model:{privateKey:'never-store'}}}])assert.throws(()=>generateMutations(d));
});
test('missing provenance produces UNKNOWN and cannot produce a discrepancy',()=>{
  const d=def();delete d.ruleModel.provenance;
  for(const v of generateMutations(d))for(const o of Object.values(v.oracle)){assert.equal(o.confidence,'UNKNOWN');assert.equal(compareMutation(o,{status:'rejected',message:'different'}).verdict,'INCONCLUSIVE');}
});
test('replay descriptors contain unsigned inputs, seed, setup and no credential material',()=>{
  const v=generateMutations(def())[0];assert.match(v.descriptor.cli,/--variant/);assert.equal(v.descriptor.definition.seed,42);
  assert.ok(!/private.?key|mnemonic|password/i.test(JSON.stringify(v.descriptor)));
  const changed=structuredClone(v.descriptor);changed.unsignedModel.verificationGasLimit++;assert.throws(()=>regenerateMutation(changed),/does not match/);
});
test('bounded shrinking moves toward nearest still-reproducing boundary without autonomous networking',async()=>{
  const result=await minimizeBoundary({value:67210,boundary:67200,reproduces:async x=>x>67200});
  assert.equal(result.value,67201);assert.equal(result.minimal,true);assert.ok(result.attempts<=8);
  const absent=await minimizeBoundary({value:67210,boundary:67200,reproduces:async()=>false});assert.equal(absent.reproduced,false);
});
test('offline preview never touches an adapter or RPC and exposes generated coverage',async()=>{
  const out=await runMutationCampaign({definition:def(),config,preview:true,rpcFn:()=>{throw new Error('must not call');},adapter:{build:()=>{throw new Error('must not call');}}});
  assert.match(out.source,/PREVIEW/);assert.equal(out.submissions,0);assert.equal(out.results.length,7);assert.equal(out.coverage.decisions,14);assert.equal(out.totals.matched,0);
  assert.deepEqual(out.coverage.rules[0].regions.sort(),['above','at','below']);
});
test('submission requires explicit test chain and enforces controlled batch size',async()=>{
  await assert.rejects(runMutationCampaign({definition:def(),config,submit:true,allowChainId:1}),/1337/);
  await assert.rejects(runMutationCampaign({definition:def({count:8}),config,submit:true,allowChainId:1337}),/limit/);
});
test('loaded verified model checks the historical evidence digest without changing it',async()=>{
  const d=await loadMutationDefinition({suite:'verification-gas',seed:42,count:7});assert.equal(d.ruleModel.provenance.confidence,'VERIFIED');
});
test('campaign re-signs each generated path through the real codec and keeps accounts isolated',async()=>{
  const setupKinds=[],signatures=[],senders=[];
  const url='http://127.0.0.1:9090';
  const testConfig={...config,authorizedEndpoints:[url],paymasterCodeHashes:{},minSponsorBalanceWei:'0'};
  const plugin=workshopPlugin(testConfig,{rpcFn:async(_,method)=>method==='eth_chainId'?'0x539':method==='eth_getCode'?'0x6000':method==='eth_call'?`0x${'0'.repeat(192)}`:'0x0'});
  const original=plugin.setup;plugin.setup=async ctx=>{setupKinds.push(ctx.setup.configuration.kind);return original(ctx);};
  const definition=def({count:3});definition.ruleModel.provenance.fixtureCodeHashes={};
  const out=await runMutationCampaign({definition,config:testConfig,adapter:createAdapter(plugin),rpcUrls:{public:url,alt:url},submit:true,allowChainId:1337,evidenceSource:'MOCK',captureRules:false,receiptWaitMs:0,
    rpcFn:async(_,method,params)=>{if(method==='eth_chainId')return '0x539';if(method==='eth_getTransactionReceipt')return null;
      let model;if(method==='eth_sendRawTransaction')model=decodeTx(profile,params[0]);
      else {model=params[0];}
      senders.push(model.sender.toLowerCase());signatures.push(JSON.stringify(model.signatures));
      const gas=Number(model.frames[1].limits.execution);
      if(gas>67200)throw new RpcResponseError(-32000,'Invalid params: Frame transaction prefix gas budget (frames + sig cost) exceeds MAX_VERIFY_GAS');
      return `0x${'a'.repeat(64)}`;
    }});
  assert.equal(out.submissions,6);assert.equal(out.totals.matched,3);assert.equal(new Set(senders).size,6);assert.equal(new Set(signatures).size,6);assert.deepEqual(setupKinds,Array(6).fill('basic'));
  assert.match(out.source,/MOCK/);assert.ok(!JSON.stringify(out).includes('privateKey'));
});
test('wrong rule class and verified outcome mismatches are distinguished',()=>{
  const reject={confidence:'VERIFIED',expected:'rejected',expectedRule:'MAX_VERIFY_GAS'};
  assert.equal(compareMutation(reject,{status:'accepted'}).verdict,'UNEXPECTED_ACCEPT');
  assert.equal(compareMutation(reject,{status:'rejected',message:'ForeignStorage'}).verdict,'UNEXPECTED_RULE_CLASS');
  assert.equal(compareMutation({...reject,expected:'accepted'},{status:'rejected',message:'ForeignStorage'}).verdict,'UNEXPECTED_REJECT');
});
