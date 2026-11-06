import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const SPRINT_BUDGET_USD=1;
export const SPRINT_ID='2026-11-06-real-agent-quality';
export const MIN_INVESTIGATION_USD=0.12;
export const DEFAULT_BYOC_RUN_USD=0.35;
export const DEFAULT_UNISWAP_RUN_USD=0.30;
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const fileFor=dir=>path.join(dir,'sprint-budget-'+SPRINT_ID+'.json');
/** Canonical prior spend for this sprint — never silently reset when --results uses a fresh directory. */
const PRIOR_LEDGER_PATHS=[
 path.join(ROOT,'evidence/playground/2026-11-06/sprint-budget-2026-11-06-real-agent-quality.json'),
];
async function readLedgerFile(file){
 try{const raw=JSON.parse(await readFile(file,'utf8'));if(raw.sprintId!==SPRINT_ID||typeof raw.spentUSD!=='number')return null;return raw;}catch{return null;}
}
async function load(dir){
 const empty={schema:'framefuzz.sprint-budget.v1',sprintId:SPRINT_ID,capUSD:SPRINT_BUDGET_USD,spentUSD:0,reservedUSD:0,entries:[],updatedAt:new Date().toISOString()};
 const target=path.resolve(fileFor(dir));
 let ledger=await readLedgerFile(target)??structuredClone(empty);
 const underRepoRuns=target.startsWith(path.resolve(ROOT,'runs')+path.sep)||target===path.resolve(ROOT,'runs',`sprint-budget-${SPRINT_ID}.json`);
 if(underRepoRuns&&!ledger.entries.some(e=>e.type==='PRIOR_IMPORT')){
  let priorMax=0;const sources=[];
  for(const priorPath of PRIOR_LEDGER_PATHS){
   if(path.resolve(priorPath)===target)continue;
   const prior=await readLedgerFile(priorPath);
   if(prior&&prior.spentUSD>priorMax){priorMax=prior.spentUSD;sources.push({path:priorPath,spentUSD:prior.spentUSD});}
  }
  if(priorMax>1e-12){
   ledger.spentUSD+=priorMax;
   ledger.entries.push({at:new Date().toISOString(),type:'PRIOR_IMPORT',label:'reconcile-same-sprint-ledger',amountUSD:priorMax,sources,remainingAfter:ledger.capUSD-ledger.spentUSD-ledger.reservedUSD});
   await save(dir,ledger);
  }
 }
 return ledger;
}
async function save(dir,ledger){
 await mkdir(dir,{recursive:true});const target=fileFor(dir),tmp=target+'.tmp';
 ledger.updatedAt=new Date().toISOString();await writeFile(tmp,JSON.stringify(ledger,null,2)+'\n');await rename(tmp,target);return ledger;
}
export async function budgetStatus(dir='runs'){const ledger=await load(dir);return {...ledger,remainingUSD:Math.max(0,ledger.capUSD-ledger.spentUSD-ledger.reservedUSD)};}
export function planInvestigationBudget({profileId='byoc',requestedUSD=null,remainingUSD,allowBelowMinimum=false}={}){
 const preferred=typeof requestedUSD==='number'&&requestedUSD>0?requestedUSD:(profileId==='uniswap-v4-paymaster'?DEFAULT_UNISWAP_RUN_USD:DEFAULT_BYOC_RUN_USD);
 const capped=Math.min(preferred,SPRINT_BUDGET_USD,Math.max(0,remainingUSD));
 const estimatedFinishUSD=profileId==='uniswap-v4-paymaster'?0.20:0.18;
 const belowMin=!allowBelowMinimum&&capped+1e-12<MIN_INVESTIGATION_USD;
 return {
  requestedUSD:preferred,
  allocatedUSD:capped,
  estimatedFinishUSD,
  canComplete:allowBelowMinimum?capped>0:capped+1e-12>=Math.min(estimatedFinishUSD,MIN_INVESTIGATION_USD),
  blockers:belowMin?[`Sprint remaining $${Number(remainingUSD).toFixed(4)} is below minimum investigation allocation $${MIN_INVESTIGATION_USD}`]:[],
 };
}
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
