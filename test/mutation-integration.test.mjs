import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createDashboardServer} from '../src/server.mjs';
import {loadMutationDefinition,runMutationCampaign} from '../src/mutations/campaign.mjs';
import {refreshEvidence} from '../src/refresh.mjs';
const exec=promisify(execFile);

test('CLI generates and replays offline mutations with deterministic semantics and no signing',async()=>{
  const directory=await mkdtemp(path.join(tmpdir(),'framefuzz-mutation-cli-'));
  try{
    const first=JSON.parse((await exec(process.execPath,['bin/framefuzz.mjs','mutate','--suite','verification-gas','--seed','42','--count','7','--preview','--results',directory])).stdout);
    assert.equal(first.submissions,0);assert.equal(first.coverage.decisions,14);assert.match(first.source,/PREVIEW/);
    const replay=JSON.parse((await exec(process.execPath,['bin/framefuzz.mjs','mutate','--replay',first.evidence.replayFile,'--variant','2','--preview','--results',directory])).stdout);
    assert.deepEqual(replay.generated[0].parameters,first.generated[2].parameters);assert.equal(replay.campaign.definitionDigest,first.campaign.definitionDigest);
    const markdown=await readFile(first.evidence.mdFile,'utf8');assert.match(markdown,/rule coverage/);assert.match(markdown,/VERIFIED/);
    const descriptor=JSON.parse(await readFile(first.evidence.replayFile,'utf8')).cases[2].reproduction;
    assert.equal(descriptor.definition.seed,42);assert.equal(descriptor.variantIndex,2);assert.ok(!JSON.stringify(descriptor).includes('privateKey'));
    await assert.rejects(exec(process.execPath,['bin/framefuzz.mjs','mutate','--submit','--allow-chain','1','--results',directory]),e=>e.code===1);
  }finally{await rm(directory,{recursive:true,force:true});}
});

test('dashboard previews generated cases and exports reproduction while rejecting unauthorized live campaigns',async()=>{
  const directory=await mkdtemp(path.join(tmpdir(),'framefuzz-mutation-web-'));
  const server=createDashboardServer({resultDir:directory});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}`;
  try{
    const config=await (await fetch(`${base}/api/config`)).json();assert.deepEqual(config.mutations.suites,['verification-gas','uniswap-storage']);
    const response=await fetch(`${base}/api/mutate`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({suite:'uniswap-storage',count:3,seed:42,preview:true})});
    assert.equal(response.status,200);const output=await response.json();assert.match(output.source,/PREVIEW/);assert.equal(output.coverage.generatedVariants,3);
    const report=await (await fetch(`${base}/api/run?id=${encodeURIComponent(output.file)}`)).json();
    assert.equal(report.results.find(c=>c.mutation.setup.staked).paths.find(p=>p.id==='alt').oracle.expected,'accepted');
    const replay=await (await fetch(`${base}/api/export?id=${encodeURIComponent(output.file)}&format=replay`)).json();assert.equal(replay.cases.length,3);assert.ok(replay.cases.every(c=>c.reproduction.definition));
    const denied=await fetch(`${base}/api/mutate`,{method:'POST',body:JSON.stringify({submit:true})});assert.equal(denied.status,409);
    const xsite=await fetch(`${base}/api/mutate`,{method:'POST',headers:{origin:'https://evil.test'},body:'{}'});assert.equal(xsite.status,403);
    const html=await (await fetch(base)).text();assert.match(html,/mutationSeed/);assert.match(html,/coverageSummary/);new Function(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
  }finally{await new Promise(r=>server.close(r));await rm(directory,{recursive:true,force:true});}
});

test('rule evidence digest mismatch and altered fixture bindings downgrade expectations to UNKNOWN',async()=>{
  const config=JSON.parse(await readFile('examples/live/devnet.json','utf8'));
  const d=await loadMutationDefinition({count:1});d.ruleModel.provenance.evidence[0].sha256='wrong';
  const out=await runMutationCampaign({definition:d,config,preview:true});assert.ok(out.results[0].paths.every(p=>p.oracle.confidence==='UNKNOWN'&&p.comparison.verdict==='INCONCLUSIVE'));
  const changed=await loadMutationDefinition({count:1});changed.ruleModel.provenance.fixtureCodeHashes.basic='changed';
  const second=await runMutationCampaign({definition:changed,config,preview:true});assert.ok(second.results[0].paths.every(p=>p.oracle.confidence==='UNKNOWN'));
});
test('historical LIVE evidence still loads and exports without generated coverage or relabeling',async()=>{
  const directory='evidence/live/2026-11-06';const manifest=JSON.parse(await readFile(`${directory}/manifest.json`,'utf8'));
  const server=createDashboardServer({resultDir:directory});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try{
    const base=`http://127.0.0.1:${server.address().port}`,id=encodeURIComponent(manifest.report);
    const report=await (await fetch(`${base}/api/run?id=${id}`)).json();assert.equal(report.source,'LIVE_RPC_SUBMISSION');assert.equal(report.results.length,6);assert.equal(report.coverage,undefined);
    const exported=await (await fetch(`${base}/api/export?id=${id}&format=json`)).json();assert.deepEqual(exported.results,report.results);
  }finally{await new Promise(r=>server.close(r));}
});
test('read-only refresh keeps mutation oracle taxonomy and recomputes rule coverage',async()=>{
  const report={schema:'framefuzz.evidence.v1',source:'LIVE_RPC_SUBMISSION',chainId:1337,campaign:{suite:'verification-gas'},results:[{id:'above',mutation:{parameter:{region:'above'}},paths:[{
    id:'alt',expected:'rejected',expectedRule:'MAX_VERIFY_GAS',oracle:{ruleId:'MAX_VERIFY_GAS',expected:'rejected',expectedRule:'MAX_VERIFY_GAS',confidence:'VERIFIED'},
    observed:{status:'rejected',code:-32000,message:'DifferentPolicyRule'}}]}]};
  const refreshed=await refreshEvidence(report,{rpcUrl:'http://127.0.0.1',allowChainId:1337,rpcFn:async(_,method)=>{assert.equal(method,'eth_chainId');return '0x539';}});
  assert.equal(refreshed.results[0].paths[0].comparison.verdict,'UNEXPECTED_RULE_CLASS');assert.equal(refreshed.coverage.rules[0].unexpected,1);assert.equal(refreshed.totals.preconditionFailures,0);
});
