import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import path from 'node:path';
import {prepareSavedDemo} from '../src/saved-demo.mjs';import {createDashboardServer} from '../src/server.mjs';import {runSuite} from '../src/runner.mjs';
async function dashboard(options,work){const dir=await mkdtemp(path.join(tmpdir(),'framefuzz-stable-'));const demo=await prepareSavedDemo(dir);const server=createDashboardServer({resultDir:dir,...options});await new Promise(r=>server.listen(0,'127.0.0.1',r));try{await work(`http://127.0.0.1:${server.address().port}`,demo,dir);}finally{await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}}
test('saved demo reads real Sonnet and exports while execution stays disabled without opt-in',async()=>{
 await dashboard({offlineDemo:true,swarmEnvironment:{OPENROUTER_API_KEY:'mock-key-never-called'},swarmRunner:()=>assert.fail('no execution')},async(base,demo)=>{
  const config=await(await fetch(base+'/api/swarm/config')).json();assert.equal(config.enabled,false);assert.equal(config.canReadSaved,true);assert.equal(config.canCallProvider,false);
  assert.equal((await(await fetch(base+'/api/swarm/recent')).json()).investigations.length,1);
  const report=await(await fetch(base+'/api/swarm/transcript?id='+demo.investigation)).json();assert.equal(report.report.realLLMCalls,4);
  assert.equal((await fetch(base+'/api/swarm/run',{method:'POST',body:JSON.stringify({mode:'simulated'})})).status,409);
  const preview=await(await fetch(base+'/api/mutate',{method:'POST',body:JSON.stringify({suite:'verification-gas',count:3,preview:true})})).json();assert.match(preview.source,/PREVIEW/);
  const replay=await(await fetch(base+'/api/export?id='+preview.file+'&format=replay')).json();assert.equal(replay.broadcastAllowed,false);assert.equal(replay.historicalSignedData,false);
 });
});
test('API rejects invalid selections, origins and report IDs with structured errors',async()=>{
 await dashboard({offlineDemo:false},async(base)=>{
  for(const body of ['null','[]','{bad','{"seed":-1}','{"submit":"true"}','{"count":1001}','{"rpc":"https://untrusted.invalid"}','{"preview":true,"submit":true}']){
   const response=await fetch(base+'/api/mutate',{method:'POST',body});assert.equal(response.status,400,body);const error=await response.json();assert.ok(error.code);assert.equal(error.category,'PREREQUISITE_FAILURE');
  }
  assert.equal((await fetch(base+'/api/run?id=../package.json')).status,400);
  assert.equal((await fetch(base+'/api/run?id=missing.json')).status,404);
  assert.equal((await fetch(base+'/api/mutate',{method:'POST',headers:{origin:'null'},body:'{}'})).status,403);
  assert.equal((await fetch(base+'/api/community/import',{method:'POST',body:'null'})).status,400);
 });
});
test('stalled Registry read/import returns bounded infrastructure error and creates no preview',async()=>{
 let calls=0;const pending=()=>{calls++;return new Promise(()=>{});};
 await dashboard({apiReadTimeoutMs:20,communityRegistry:{query:pending,fetch:pending,importPreview:pending}},async(base)=>{
  const key='0x'+'a'.repeat(64);
  for(const [url,options]of [['/api/community',{}],['/api/community/case?key='+key,{}],['/api/community/import',{method:'POST',body:JSON.stringify({key})}]]){
   const r=await fetch(base+url,options);assert.equal(r.status,504);const body=await r.json();assert.equal(body.code,'READ_TIMEOUT');assert.equal(body.category,'INFRASTRUCTURE_FAILURE');
  }
  assert.equal(calls,3);assert.equal((await(await fetch(base+'/api/runs')).json()).runs.length,3);
 });
});
test('generic submission budget refuses oversized work before any RPC or signing',async()=>{
 await assert.rejects(runSuite([{id:'too-many',paths:Array.from({length:15},()=>({id:'alt'}))}],{submit:true,allowChainId:1337,rpcFn:()=>assert.fail('no requests')}),/budget/);
});
