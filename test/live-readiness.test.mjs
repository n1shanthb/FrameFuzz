import test from 'node:test';
import assert from 'node:assert/strict';
import {approvalStop,boundedReadinessProbe,capabilityModel,prepareStageAManifest} from '../src/live-readiness.mjs';

test('saved demo is irrevocably paid, network and write disabled even with every key',()=>{
  const env={OPENROUTER_API_KEY:'paid',ARKIV_PRIVATE_KEY:'0x'+'11'.repeat(32),FRAMEFUZZ_DEPLOYER_KEY:'0x'+'22'.repeat(32)};
  const model=capabilityModel({offlineDemo:true,env});
  assert.equal(model.mode,'SAVED_DEMO');assert.equal(model.readOnlyNetwork,false);assert.equal(model.paidProviderCalls,false);assert.equal(model.writesEnabled,false);
  assert.equal(model.credentials.OPENROUTER_API_KEY,true);
  assert.throws(()=>capabilityModel({offlineDemo:true,requestedMode:'LIVE_AUTHORIZED',env}),/irrevocably/);
});

test('normal modes never derive paid or write authority from credential presence',()=>{
  const env={OPENROUTER_API_KEY:'configured',ARKIV_PRIVATE_KEY:'configured',FRAMEFUZZ_DEPLOYER_KEY:'configured'};
  for(const requestedMode of ['LIVE_READ_ONLY','LIVE_AUTHORIZED']){
    const model=capabilityModel({requestedMode,env});
    assert.equal(model.mode,requestedMode);assert.equal(model.readOnlyNetwork,true);
    assert.equal(model.paidProviderCalls,false);assert.equal(model.writesEnabled,false);
    assert.equal(model.approvalPolicy,'OPERATION_AND_MANIFEST_SPECIFIC_ONE_TIME');
  }
  assert.throws(()=>capabilityModel({requestedMode:'LIVE'}),/Invalid capability mode/);
});

test('Arkiv and first EF manifests are exact, distinct, and stopped at approval',()=>{
  const arkiv=prepareStageAManifest('ARKIV_PUBLISH',{env:{}});
  const ef=prepareStageAManifest('EIP8141_UNISWAP_COMPARE',{env:{}});
  assert.match(arkiv.manifestDigest,/^[\da-f]{64}$/);assert.match(ef.manifestDigest,/^[\da-f]{64}$/);
  assert.notEqual(arkiv.manifestDigest,ef.manifestDigest);
  for(const manifest of [arkiv,ef]){assert.equal(manifest.status,'AWAITING_EXPLICIT_APPROVAL');assert.equal(manifest.stopAfter,'approve');assert.equal(manifest.submitted,false);}
  assert.deepEqual(arkiv.pathway,['prepare','approve','submit','reconcile','query','verify','import']);
  assert.equal(ef.maxVariants,1);assert.equal(ef.chainId,1337);assert.equal(ef.scenario,'uniswap-v4-paymaster');
});

test('approval boundary is operation and digest specific but issues no reusable token',()=>{
  const manifest=prepareStageAManifest('ARKIV_PUBLISH');
  const stopped=approvalStop(manifest.manifestDigest,manifest.operation);
  assert.equal(stopped.approvalIssued,false);assert.equal(stopped.consumed,false);assert.equal(stopped.oneTime,true);
  assert.equal(stopped.manifestDigest,manifest.manifestDigest);
  assert.throws(()=>approvalStop('bad',manifest.operation),/exact Stage A manifest/);
  assert.throws(()=>approvalStop(manifest.manifestDigest,'OTHER'),/exact Stage A manifest/);
});

test('saved demo readiness performs zero endpoint probes',async()=>{
  let calls=0;
  const result=await boundedReadinessProbe({mode:'SAVED_DEMO',fetchImpl:async()=>{calls++;}});
  assert.equal(calls,0);assert.equal(result.status,'SAVED_DEMO_NETWORK_DISABLED');assert.equal(result.paidCalls,0);assert.equal(result.writes,0);
});

test('normal readiness makes only two bounded JSON-RPC chain-id reads',async()=>{
  const requests=[];
  const fetchImpl=async(url,options)=>{
    requests.push({url,options,body:JSON.parse(options.body)});
    const result=url.includes('arkiv.network')?'0x76edaf':'0x539';
    return {ok:true,json:async()=>({jsonrpc:'2.0',id:1,result})};
  };
  const result=await boundedReadinessProbe({mode:'LIVE_READ_ONLY',fetchImpl,timeoutMs:500});
  assert.equal(requests.length,2);assert.ok(requests.every(r=>r.options.method==='POST'&&r.body.method==='eth_chainId'));
  assert.equal(result.status,'READ_ONLY_READY');assert.equal(result.paidCalls,0);assert.equal(result.writes,0);
  await assert.rejects(()=>boundedReadinessProbe({mode:'LIVE_READ_ONLY',fetchImpl,timeoutMs:6000}),/100–5000/);
});

test('readiness reports partial without converting endpoint failure into write capability',async()=>{
  const result=await boundedReadinessProbe({mode:'LIVE_AUTHORIZED',fetchImpl:async()=>{throw new Error('offline');},timeoutMs:200});
  assert.equal(result.status,'READ_ONLY_PARTIAL');assert.equal(result.probes.length,2);assert.ok(result.probes.every(p=>p.status==='UNAVAILABLE'));
  assert.equal(result.writes,0);assert.equal(result.paidCalls,0);
});
