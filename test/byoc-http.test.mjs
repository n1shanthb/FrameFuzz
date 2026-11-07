import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import path from 'node:path';
import {createDashboardServer} from '../src/server.mjs';
import {CONTRACT_A,byocTestProvider} from '../scripts/test-support/byoc.mjs';
async function server(dir,options={}){const app=createDashboardServer({resultDir:dir,swarmEnvironment:{FRAMEFUZZ_SWARM:'on'},playgroundProviderFactory:()=>byocTestProvider(),...options});await new Promise(r=>app.listen(0,'127.0.0.1',r));return {app,url:`http://127.0.0.1:${app.address().port}`};}
const post=(url,route,body)=>fetch(url+'/api/playground/'+route,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
async function poll(url,id){for(let i=0;i<100;i++){const j=await(await fetch(url+'/api/playground/job?id='+id)).json();if(j.state!=='RUNNING')return j;await new Promise(r=>setTimeout(r,25));}throw Error('Test job deadline');}
test('HTTP intake -> mocked stateful negotiation -> real local tools -> export/replay works after fresh server restart',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'ff-byoc-http-'));let current=await server(dir);
 try{
  const a=await(await post(current.url,'analyze',{source:CONTRACT_A})).json();assert.equal(a.status,'READY');
  assert.equal((await post(current.url,'start',{analysisId:a.analysisId,sourceDigest:a.sourceDigest})).status,400);
  assert.equal((await post(current.url,'start',{analysisId:a.analysisId,sourceDigest:'0'.repeat(64),authorizeProvider:true})).status,409);
  const start=await(await post(current.url,'start',{analysisId:a.analysisId,sourceDigest:a.sourceDigest,authorizeProvider:true})).json();const finished=await poll(current.url,start.id);assert.equal(finished.state,'COMPLETE',finished.error);assert.match(finished.report.source,/MOCK/);
  const entry=finished.report.workspace.proposals.find(p=>p.state==='EXECUTED');assert.equal(entry.execution.actual.error,'ABI_INTEGER_RANGE');
  const json=await(await fetch(current.url+'/api/playground/export?id='+start.id)).json();assert.equal(json.sourceDigest,a.sourceDigest);assert.equal(json.broadcasts,0);
  const md=await(await fetch(current.url+'/api/playground/export?id='+start.id+'&format=markdown')).text();assert.match(md,/FreshQuotaJournal/);assert.match(md,/XFAIL/);
  await new Promise(r=>current.app.close(r));current=await server(dir);
  const restored=await(await fetch(current.url+'/api/playground/job?id='+start.id)).json();assert.equal(restored.report.contentDigest,json.contentDigest);
  const replay=await(await post(current.url,'replay',{id:start.id,entryId:entry.entryId})).json();assert.equal(replay.paidCalls,0);assert.equal(replay.result.outcome.classification,'XFAIL');
  assert.equal((await post(current.url,'analyze',{source:CONTRACT_A,rpc:'https://must-not-send.invalid'})).status,400);
 }finally{await new Promise(r=>current.app.close(r));await rm(dir,{recursive:true,force:true});}
});
test('offline mode compiles source but cannot start providers or accept unsafe origins/write fields',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'ff-byoc-offline-'));let calls=0;const current=await server(dir,{offlineDemo:true,playgroundProviderFactory:()=>{calls++;throw Error('must not call');}});
 try{
  const a=await(await post(current.url,'analyze',{source:CONTRACT_A})).json();assert.equal(a.status,'READY');
  assert.equal((await post(current.url,'start',{analysisId:a.analysisId,sourceDigest:a.sourceDigest,authorizeProvider:true})).status,409);
  const hostile=await fetch(current.url+'/api/playground/analyze',{method:'POST',headers:{Origin:'https://hostile.invalid'},body:JSON.stringify({source:CONTRACT_A})});assert.equal(hostile.status,403);
  assert.equal((await post(current.url,'start',{submit:true})).status,400);assert.equal(calls,0);
 }finally{await new Promise(r=>current.app.close(r));await rm(dir,{recursive:true,force:true});}
});
test('HTTP cancellation aborts an in-flight mocked model request and preserves cancelled report',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'ff-byoc-cancel-')),current=await server(dir,{playgroundProviderFactory:()=>byocTestProvider({stall:true})});
 try{
  const a=await(await post(current.url,'analyze',{source:CONTRACT_A})).json();const start=await(await post(current.url,'start',{analysisId:a.analysisId,sourceDigest:a.sourceDigest,authorizeProvider:true})).json();
  assert.equal((await post(current.url,'cancel',{id:start.id})).status,200);const result=await poll(current.url,start.id);assert.equal(result.state,'CANCELLED');assert.equal(result.report.broadcasts,0);assert.equal(result.report.workspace.proposals.length,0);
 }finally{await new Promise(r=>current.app.close(r));await rm(dir,{recursive:true,force:true});}
});
