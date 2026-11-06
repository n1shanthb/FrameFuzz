import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
export const SPRINT_BUDGET_USD=1;
export const SPRINT_ID='2026-11-06-real-agent-quality';
const fileFor=dir=>path.join(dir,'sprint-budget-'+SPRINT_ID+'.json');
async function load(dir){
 try{const raw=JSON.parse(await readFile(fileFor(dir),'utf8'));if(raw.sprintId!==SPRINT_ID||typeof raw.spentUSD!=='number')throw Error();return raw;}
 catch{return {schema:'framefuzz.sprint-budget.v1',sprintId:SPRINT_ID,capUSD:SPRINT_BUDGET_USD,spentUSD:0,reservedUSD:0,entries:[],updatedAt:new Date().toISOString()};}
}
async function save(dir,ledger){
 await mkdir(dir,{recursive:true});const target=fileFor(dir),tmp=target+'.tmp';
 ledger.updatedAt=new Date().toISOString();await writeFile(tmp,JSON.stringify(ledger,null,2)+'\n');await rename(tmp,target);return ledger;
}
export async function budgetStatus(dir='runs'){const ledger=await load(dir);return {...ledger,remainingUSD:Math.max(0,ledger.capUSD-ledger.spentUSD-ledger.reservedUSD)};}
export async function reserveBudget(dir,label,amountUSD){
 if(!(amountUSD>0)||amountUSD>SPRINT_BUDGET_USD)throw Error('Invalid budget reservation');
 const ledger=await load(dir);const remaining=ledger.capUSD-ledger.spentUSD-ledger.reservedUSD;
 if(amountUSD>remaining+1e-12)throw Error(`SPRINT_BUDGET_EXHAUSTED: need $${amountUSD} remaining $${remaining}`);
 ledger.reservedUSD+=amountUSD;ledger.entries.push({at:new Date().toISOString(),type:'RESERVE',label,amountUSD,remainingAfter:ledger.capUSD-ledger.spentUSD-ledger.reservedUSD});
 await save(dir,ledger);return budgetStatus(dir);
}
export async function settleBudget(dir,label,{reservedUSD,actualUSD,providerSummary=null,failed=false}={}){
 const ledger=await load(dir);if(!(reservedUSD>=0)||!(actualUSD>=0))throw Error('Invalid settlement');
 ledger.reservedUSD=Math.max(0,ledger.reservedUSD-reservedUSD);
 ledger.spentUSD+=actualUSD;
 if(ledger.spentUSD>ledger.capUSD+1e-9)throw Error('SPRINT_BUDGET_OVERSPEND');
 ledger.entries.push({at:new Date().toISOString(),type:failed?'FAILED_BILLABLE':'SETTLE',label,reservedUSD,actualUSD,providerCalls:providerSummary?.calls??null,generationIds:(providerSummary?.requests??[]).map(r=>r.generationId).filter(Boolean),remainingAfter:ledger.capUSD-ledger.spentUSD-ledger.reservedUSD});
 await save(dir,ledger);return budgetStatus(dir);
}
export function attachSprintBudget(provider,dir,label,{maxUSD}={}){
 if(!(maxUSD>0))throw Error('maxUSD required');
 const original=provider.structured.bind(provider);
 let reserved=false;
 provider.ensureSprintReserve=async()=>{if(reserved)return;await reserveBudget(dir,label,maxUSD);reserved=true;provider.limits={...provider.limits,maxCostUSD:Math.min(provider.limits.maxCostUSD,maxUSD)};};
 provider.settleSprint=async({failed=false}={})=>{
  const actual=provider.kind==='OPENROUTER'?provider.costUSD:0;
  if(!reserved&&actual===0)return budgetStatus(dir);
  if(!reserved)await reserveBudget(dir,label,maxUSD);
  return settleBudget(dir,label,{reservedUSD:maxUSD,actualUSD:actual,providerSummary:provider.summary(),failed});
 };
 provider.structured=async(...args)=>{await provider.ensureSprintReserve();return original(...args);};
 return provider;
}
