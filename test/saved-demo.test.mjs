import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';import path from 'node:path';import {tmpdir} from 'node:os';
import {prepareSavedDemo} from '../src/saved-demo.mjs';import {createDashboardServer} from '../src/server.mjs';
test('saved demonstration copies immutable real reports and blocks all external network routes',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'framefuzz-saved-'));const demo=await prepareSavedDemo(dir);assert.equal(demo.files.length,3);assert.equal(JSON.parse(await readFile(path.join(dir,demo.defaultRun))).source,'LIVE_RPC_SUBMISSION');
 const server=createDashboardServer({resultDir:dir,offlineDemo:true,submit:true,rpcUrl:'https://must-not-request.invalid',allowChainId:1337,swarmEnvironment:{FRAMEFUZZ_SWARM:'on'},communityRegistry:{query(){assert.fail('offline must never query network');}}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 try{const investigation=JSON.parse(await readFile(path.join(dir,'swarm',demo.investigation+'.json')));assert.equal(investigation.realLLMCalls,4);assert.equal(investigation.experiments.length,2);
 const config=await(await fetch(base+'/api/config')).json();assert.equal(config.submitEnabled,false);assert.equal(config.offlineDemo,true);
 const swarm=await(await fetch(base+'/api/swarm/config')).json();assert.equal(swarm.canCallProvider,false);assert.equal(swarm.provider.configured,false);
 const restored=await(await fetch(base+'/api/swarm/transcript?id='+demo.investigation)).json();assert.equal(restored.report.realLLMCalls,4);
 const agentic=await(await fetch(base+'/api/swarm/transcript?id='+demo.agenticInvestigation)).json();assert.equal(agentic.report.pipelineVersion,'framefuzz.agentic-feasibility.v1');assert.equal(agentic.report.proposals.length,2);
 const exported=await(await fetch(base+'/api/swarm/export?id='+demo.agenticInvestigation+'&format=json')).json();assert.equal(exported.proposals[0].outcomes[0].classification,'XPASS');assert.equal(exported.proposals[1].outcomes[0].observedVerdict,null);assert.equal(exported.broadcasts,0);
 assert.equal((await fetch(base+'/api/community')).status,503);assert.equal((await fetch(base+'/api/community/case?key=bad')).status,503);assert.equal((await fetch(base+'/api/community/import',{method:'POST',body:'{}'})).status,503);assert.deepEqual((await(await fetch(base+'/api/network')).json()).endpoints,[]);
 assert.equal((await fetch(base+'/api/run',{method:'POST',body:'{}'})).status,409);const p=await(await fetch(base+'/api/mutate',{method:'POST',body:JSON.stringify({suite:'uniswap-storage',count:3,seed:42,preview:true})})).json();assert.match(p.source,/PREVIEW/);assert.equal(p.totals.cases,3);
 assert.match(await(await fetch(base+'/')).text(),/Generate → Compare → Inspect/);
 assert.match(await(await fetch(base+'/')).text(),/Technical Briefing/);
 assert.equal((await fetch(base+'/css/app.css')).status,200);
 }finally{await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
