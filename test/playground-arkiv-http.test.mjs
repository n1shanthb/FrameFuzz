import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createDashboardServer} from '../src/server.mjs';
import {byocTestProvider} from '../scripts/test-support/byoc.mjs';
async function server(dir,options={}){
  const app=createDashboardServer({
    resultDir:dir,
    swarmEnvironment:{FRAMEFUZZ_SWARM:'on',...(options.env||{})},
    playgroundProviderFactory:()=>byocTestProvider({forceRepair:false}),
    ...options,
  });
  await new Promise(r=>app.listen(0,'127.0.0.1',r));
  return {app,url:`http://127.0.0.1:${app.address().port}`};
}
const post=(url,route,body)=>fetch(url+'/api/playground/'+route,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});

test('analyze Uniswap profile auto-discovers Arkiv without consent and never broadcasts',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'ff-arkiv-http-'));
  const entity='0xf1089c05e4a7ec4d3a66087381c1c78b43728a836e4ae10eb694cfd6ce2a06a1';
  let queried=false,imported=false;
  const mockRegistry=()=>({
    async query({suite}){
      queried=true;
      if(suite!=='uniswap-storage'&&suite!=='verification-gas')return {cases:[],rejected:[]};
      return {cases:[{
        key:entity,owner:'0x20370BE5BA867Ab4779ad0686963A55ADc0722b1',creator:'0x20370BE5BA867Ab4779ad0686963A55ADc0722b1',expiresAtBlock:'345303',
        provenance:'FRESH_ARKIV_READ',verification:{schema:'VALID',digest:'VALID',creatorBinding:'VALID',expiry:'ACTIVE',replayAllowed:true},
        record:{publisher:'0x20370BE5BA867Ab4779ad0686963A55ADc0722b1',contentDigest:'0f7f014559fbfb6ea828820cc954401f1562937b66c2fe24360959dcb5196b25',
          suite:suite==='uniswap-storage'?'uniswap-storage':'verification-gas',mutationFamily:suite==='uniswap-storage'?'uniswap-storage':'verification-gas',
          ruleId:suite==='uniswap-storage'?'STORAGE_ACCESS':'MAX_VERIFY_GAS',implementationVersion:'v1',semanticParameters:{value:1},
          originalOutcomes:{public:{expected:'accepted',admission:'accepted',verdict:'X',confidence:'VERIFIED'},alt:{expected:'accepted',admission:'accepted',verdict:'X',confidence:'VERIFIED'}},
          reproduction:{definitionDigest:'d'},
          ...(suite==='uniswap-storage'?{uniswap:{protocol:'uniswap-v4',poolId:'0x1',contracts:{stateView:{address:'0x2'}},paymaster:{address:'0x3',stake:{staked:true}}}}:{}),
        },
      }],rejected:[]};
    },
    async importPreview(key){
      imported=true;
      assert.equal(key,entity);
      return {
        retrieved:{key:entity,owner:'0x20370BE5BA867Ab4779ad0686963A55ADc0722b1',creator:'0x20370BE5BA867Ab4779ad0686963A55ADc0722b1',expiresAtBlock:'345303',
          record:{contentDigest:'0f7f014559fbfb6ea828820cc954401f1562937b66c2fe24360959dcb5196b25'},
          verification:{schema:'VALID',digest:'VALID',creatorBinding:'VALID',expiry:'ACTIVE',replayAllowed:true}},
        preview:{source:'PREVIEW_COMMUNITY — UNTRUSTED, NO BROADCAST',submissions:0,communityOrigin:{entityKey:entity},results:[]},
      };
    },
  });
  const current=await server(dir,{arkivRegistryFactory:mockRegistry});
  try{
    const a=await(await post(current.url,'analyze',{profile:'uniswap-v4-paymaster'})).json();
    assert.equal(a.status,'READY');
    assert.ok(queried);
    assert.equal(a.arkivDiscovery.status,'AVAILABLE');
    assert.ok(a.arkivDiscovery.cases.length>=1);
    assert.equal(a.arkivDiscovery.broadcasts,0);

    const imp=await(await post(current.url,'arkiv/import',{entityKey:entity})).json();
    assert.equal(imp.broadcasts,0);
    assert.equal(imp.submissions,0);
    assert.equal(imp.mode,'UNSIGNED_COMMUNITY_IMPORT');
    assert.ok(imported);
    assert.equal(imp.labels.historical,'IMPORTED_HISTORICAL_CASE');

    const forbidden=await post(current.url,'arkiv/import',{entityKey:entity,submit:true});
    assert.equal(forbidden.status,400);

    const pub=await(await post(current.url,'arkiv/publish-preview',{
      contentDigest:'0f7f014559fbfb6ea828820cc954401f1562937b66c2fe24360959dcb5196b25',
      sourceReport:'x',suite:'verification-gas',ruleId:'MAX_VERIFY_GAS',expiresAtBlock:'345303',
      live:{gasPriceWei:'1000000000',nonce:0,balanceWei:'10000000000000000000',currentBlock:'1'},
    })).json();
    assert.equal(pub.operatorRequired,true);
    assert.equal(pub.canPublish,false);
  }finally{await new Promise(r=>current.app.close(r));await rm(dir,{recursive:true,force:true});}
});

test('operator publish preview/confirm requires explicit confirm and refuses intent drift; no auto-retry',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'ff-arkiv-pub-'));
  const key='0x'+'22'.repeat(32);
  let submits=0;
  const current=await server(dir,{
    env:{ARKIV_PRIVATE_KEY:key},
    arkivPublishSubmit:async()=>{submits++;return {entityKey:'0x'+'cd'.repeat(32),transactionHash:'0x'+'ef'.repeat(32)};},
  });
  try{
    const preview=await(await post(current.url,'arkiv/publish-preview',{
      contentDigest:'0f7f014559fbfb6ea828820cc954401f1562937b66c2fe24360959dcb5196b25',
      sourceReport:'evidence/mutations/x.json',suite:'verification-gas',ruleId:'MAX_VERIFY_GAS',expiresAtBlock:'345303',maxFeeEther:'0.001',
      live:{gasPriceWei:'1000000000',nonce:0,balanceWei:'10000000000000000000',currentBlock:'302000'},
    })).json();
    assert.equal(preview.canPublish,true);
    assert.equal(preview.broadcasts,0);

    const noConfirm=await post(current.url,'arkiv/publish-confirm',{intentDigest:preview.confirmToken});
    assert.equal(noConfirm.status,400);

    const badIntent=await post(current.url,'arkiv/publish-confirm',{intentDigest:'ff'.repeat(32),confirm:true});
    assert.equal(badIntent.status,409);

    const ok=await(await post(current.url,'arkiv/publish-confirm',{intentDigest:preview.confirmToken,confirm:true,maxFeeEther:'0.001'})).json();
    assert.equal(ok.status,'PUBLISHED');
    assert.equal(submits,1);

    const reuse=await post(current.url,'arkiv/publish-confirm',{intentDigest:preview.confirmToken,confirm:true,maxFeeEther:'0.001'});
    assert.equal(reuse.status,409);
    assert.equal(submits,1);
  }finally{await new Promise(r=>current.app.close(r));await rm(dir,{recursive:true,force:true});}
});

test('BYOC investigation still completes when Arkiv lookup is unavailable',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'ff-arkiv-inv-'));
  const {CONTRACT_A}=await import('../scripts/test-support/byoc.mjs');
  const current=await server(dir,{
    arkivRegistryFactory:()=>({query:async()=>{throw new Error('forced outage');}}),
  });
  try{
    const a=await(await post(current.url,'analyze',{source:CONTRACT_A})).json();
    assert.ok(['NO_APPLICABLE_QUERY','UNAVAILABLE','EMPTY'].includes(a.arkivDiscovery.status));
    const start=await(await post(current.url,'start',{analysisId:a.analysisId,sourceDigest:a.sourceDigest,authorizeProvider:true,budgetUSD:0.01})).json();
    let finished;
    for(let i=0;i<120;i++){finished=await(await fetch(current.url+'/api/playground/job?id='+start.id)).json();if(finished.state!=='RUNNING')break;await new Promise(r=>setTimeout(r,25));}
    assert.equal(finished.state,'COMPLETE',finished.error);
    assert.equal(finished.report.broadcasts,0);
    assert.ok(finished.report.arkivIntelligence);
    assert.ok(finished.report.workspace.messages.some(m=>m.type==='COMMUNITY_REGRESSION_INTELLIGENCE'));
  }finally{await new Promise(r=>current.app.close(r));await rm(dir,{recursive:true,force:true});}
});
