// Aggregate explicitly selected existing LIVE reports. No transaction submission.
import { readFile,writeFile,mkdir,copyFile } from 'node:fs/promises';
import path from 'node:path';
import { rpc } from '../src/rpc.mjs';
import { saveReport } from '../src/reports.mjs';
import { redact,assertTestChain } from '../src/safety.mjs';

const files=process.argv.slice(2);
if(!files.length)throw new Error('Supply existing LIVE evidence JSON paths');
const config=JSON.parse(await readFile('examples/live/devnet.json','utf8'));
const url=config.authorizedEndpoints[0];
assertTestChain(Number(BigInt(await rpc(url,'eth_chainId'))),1337);
const directory='evidence/live/2026-11-06';await mkdir(directory,{recursive:true});
const inputs=[];
for(const file of files){
  const value=JSON.parse(await readFile(file,'utf8'));
  if(value.schema!=='framefuzz.evidence.v1'||value.source!=='LIVE_RPC_SUBMISSION'||value.chainId!==1337)throw new Error('Only actual chain-1337 LIVE evidence can be aggregated');
  inputs.push(value);await copyFile(file,path.join(directory,path.basename(file)));
}
const results=inputs.flatMap(x=>x.results);
if(new Set(results.map(x=>x.id)).size!==results.length)throw new Error('Duplicate case IDs; select final reports only');
for(const c of results)for(const p of c.paths)if(p.id==='alt'){
  const hash=p.observed.hash??p.metadata?.transaction?.hash;
  try {p.admissionReport=await rpc(url,'skandha_explorer_getTransaction',[hash]);}
  catch(error){p.admissionReport={unavailable:error.message};}
}
const output=redact({schema:'framefuzz.evidence.v1',source:'LIVE_RPC_SUBMISSION',generatedAt:new Date().toISOString(),chainId:1337,
  rpc:url,network:{executionClient:await rpc(config.authorizedEndpoints[1],'web3_clientVersion'),sidecar:await rpc(url,'skandha_explorer_info')},
  originalReports:files,submissions:inputs.reduce((sum,x)=>sum+x.submissions,0),results,
  receiptNote:'Real devnet run. Submission and inclusion are separate. Full receipts and raw replay inputs are retained; no automatic rebroadcast.',
  totals:{cases:results.length,matched:results.filter(c=>c.verdict==='MATCH').length,unexpected:results.filter(c=>c.verdict==='UNEXPECTED').length,inconclusive:results.filter(c=>c.verdict==='INCONCLUSIVE').length,transportFailures:0}});
const saved=await saveReport(output,directory);const dashboard=await saveReport(output,'runs');
await copyFile('runs/live-reserve-deployment.json',path.join(directory,'reserve-deployment.json'));
await writeFile(path.join(directory,'manifest.json'),JSON.stringify({schema:'framefuzz.evidence-manifest.v1',source:'LIVE_RPC_SUBMISSION',generatedAt:output.generatedAt,report:path.basename(saved.jsonFile),dashboardReport:path.basename(dashboard.jsonFile),originalReports:files},null,2)+'\n');
console.log(JSON.stringify({totals:output.totals,submissions:output.submissions,saved,dashboard},null,2));
