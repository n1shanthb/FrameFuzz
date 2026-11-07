import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createDashboardServer} from '../src/server.mjs';
import {budgetStatus} from '../src/playground/budget.mjs';
function loadEnv(text){for(const line of text.split(/\r?\n/)){const t=line.trim();if(!t||t.startsWith('#')||!t.includes('='))continue;const i=t.indexOf('=');const k=t.slice(0,i).trim();let v=t.slice(i+1).trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);if(!(k in process.env))process.env[k]=v;}}
const mode=process.argv[2];
if(!['byoc','uniswap-v4-paymaster'].includes(mode))throw Error('Usage: node scripts/paid-playground-run.mjs <byoc|uniswap-v4-paymaster>');
loadEnv(await readFile('.env','utf8'));
if(!process.env.OPENROUTER_API_KEY)throw Error('OPENROUTER_API_KEY missing');
process.env.FRAMEFUZZ_SWARM='on';
const resultDir=path.join('runs','paid-sprint');
await mkdir(resultDir,{recursive:true});
const before=await budgetStatus(resultDir);
console.log('budget_before',before);
const NEW_CONTRACT=`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
/// Fresh inventory lock used only for this paid BYOC investigation.
contract FreshInventoryLock {
    mapping(address => uint256) public reserved;
    uint8 public maxBatch;
    event Reserved(address indexed who, uint256 amount);
    constructor(uint8 batchLimit) { require(batchLimit > 0 && batchLimit < 64, "batch"); maxBatch = batchLimit; }
    function reserve(uint256 amount) external {
        require(amount > 0, "zero");
        require(amount <= maxBatch, "batch");
        reserved[msg.sender] += amount;
        emit Reserved(msg.sender, amount);
    }
    function release(uint256 amount) external {
        require(amount > 0, "zero");
        require(reserved[msg.sender] >= amount, "underflow");
        reserved[msg.sender] -= amount;
    }
}`;
const server=createDashboardServer({resultDir,swarmEnvironment:process.env});
await new Promise(r=>server.listen(4197,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
try{
 const analyzeBody=mode==='byoc'?{source:NEW_CONTRACT,role:'UNKNOWN',profile:'byoc'}:{profile:mode};
 const analysis=await(await fetch(base+'/api/playground/analyze',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(analyzeBody)})).json();
 if(analysis.status!=='READY')throw Error('Analyze failed: '+JSON.stringify(analysis));
 console.log('analysis',{status:analysis.status,contract:analysis.contractName,digest:analysis.sourceDigest,analysisId:analysis.analysisId,profile:analysis.profile?.id||'byoc'});
 const budgetUSD=mode==='byoc'?0.55:0.40;
 const start=await(await fetch(base+'/api/playground/start',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({analysisId:analysis.analysisId,sourceDigest:analysis.sourceDigest,authorizeProvider:true,budgetUSD})})).json();
 if(!start.id)throw Error('Start failed: '+JSON.stringify(start));
 console.log('started',start);
 let finished;
 for(let i=0;i<240;i++){
  finished=await(await fetch(base+'/api/playground/job?id='+encodeURIComponent(start.id))).json();
  process.stdout.write(`\rstate=${finished.state} timeline=${(finished.timeline||[]).length}   `);
  if(finished.state&&finished.state!=='RUNNING')break;
  await new Promise(r=>setTimeout(r,1000));
 }
 console.log('');
 const out=path.join(resultDir,mode+'-paid-report.json');
 await writeFile(out,JSON.stringify(finished,null,2)+'\n');
 const after=await budgetStatus(resultDir);
 await writeFile(path.join(resultDir,mode+'-budget-after.json'),JSON.stringify({before,after,job:start,reportPath:out},null,2)+'\n');
 console.log('done',{status:finished.state,error:finished.error,realModelCalls:finished.report?.realModelCalls,cost:finished.report?.provider?.costUSD,calls:finished.report?.provider?.calls,proposals:finished.report?.workspace?.proposals?.map(e=>({id:e.proposal.id,domain:e.proposal.domain,state:e.state,cls:e.outcome?.classification})),budget:after});
}finally{await new Promise(r=>server.close(r));}
