import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {assertSwarmEnabled,rejectNetworkWrites} from './gate.mjs';
const stringify=value=>JSON.stringify(value,(_,v)=>typeof v==='bigint'?String(v):v,2);
export async function swarmCommand(options){
  assertSwarmEnabled();rejectNetworkWrites(options);
  for(const key of Object.keys(options))if(!['_','output','seed','deployer','owner'].includes(key))throw new Error('Unsupported swarm option '+key);
  const [action='offline']=options._;let report;
  if(action==='offline')report=await(await import('./offline.mjs')).offlineSwarm({seed:options.seed===undefined?42:Number(options.seed)});
  else throw new Error('Milestone1 supports swarm offline only');
  const output=options.output??`runs/swarm-${action}.json`;
  await mkdir(path.dirname(output),{recursive:true});await writeFile(output,stringify(report)+'\n');
  console.log(stringify({output:path.resolve(output),schema:report.schema,source:report.source,milestone:report.milestone,verdict:report.verdict,liveExecutions:0,realLLMCalls:0,unauthorizedActionProven:false,blockers:report.blockers??report.limitations}));
}
