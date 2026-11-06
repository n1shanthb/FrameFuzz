import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import {assertSwarmEnabled,rejectNetworkWrites} from './gate.mjs';
const stringify=value=>JSON.stringify(value,(_,v)=>typeof v==='bigint'?String(v):v,2);
export async function swarmCommand(options){
  assertSwarmEnabled();rejectNetworkWrites(options);
  for(const key of Object.keys(options))if(!['_','output','seed','deployer','owner','mode','offline','variant'].includes(key))throw new Error('Unsupported swarm option '+key);
  const [action='offline']=options._;let report;
  if(action==='offline')report=await(await import('./offline.mjs')).offlineSwarm({seed:options.seed===undefined?42:Number(options.seed)});
  else if(action==='preflight')report=await(await import('./preflight.mjs')).swarmPreflight({deployer:options.deployer,owner:options.owner});
  else if(action==='investigate'){
    if(options.offline&&options.mode==='openrouter')throw new Error('Offline mode prohibits model network requests');
    report=await(await import('./investigate.mjs')).investigate({mode:options.offline?'simulated':options.mode??'simulated',authorizeProvider:options.mode==='openrouter'});
  }
  else if(action==='replay'){
    if(!options._[1])throw new Error('Replay requires a regression descriptor file');
    const file=JSON.parse(await readFile(options._[1],'utf8')),index=Number(options.variant??0);if(!Number.isSafeInteger(index)||index<0||index>1)throw new Error('Replay variant must be0 or1');
    const descriptor=file.schema==='framefuzz.offline-regression.v1'&&index===0?file:file.descriptors?.[index]??file.experiments?.[index]?.execution?.descriptor;
    if(!descriptor)throw new Error('No offline regression descriptor found');report=await(await import('./replay.mjs')).independentlyReplay(descriptor);
  }else throw new Error('Swarm supports offline, preflight, investigate or replay only; no live writes');
  const output=options.output??`runs/swarm-${action}.json`;
  await mkdir(path.dirname(output),{recursive:true});await writeFile(output,stringify(report)+'\n');
  console.log(stringify({output:path.resolve(output),schema:report.schema,source:report.source,milestone:report.milestone,status:report.status,verdict:report.verdict,liveExecutions:0,realLLMCalls:report.realLLMCalls??0,provider:report.provider,mutations:report.experiments?.map(e=>e.execution.mutationValues),independentlyReproduced:report.independentlyReproduced,unauthorizedActionProven:false,blockers:report.blockers??report.limitations}));
  if(report.status==='INCOMPLETE')process.exitCode=2;
}
