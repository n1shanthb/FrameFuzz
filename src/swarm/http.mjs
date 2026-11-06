import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import path from 'node:path';import {randomUUID} from 'node:crypto';
import {openRouterStatus} from './provider.mjs';
const ID=/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
export function createSwarmRoutes({resultDir,offlineDemo,getRunning,setRunning,env=process.env,runner}){
 const jobs=new Map(),directory=path.join(resultDir,'swarm');
 const json=(res,status,data)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(data));};
 const load=async id=>{if(!ID.test(id??''))throw new Error('Invalid investigation ID');const j=jobs.get(id);if(j)return {id,state:j.state,timeline:j.timeline,report:j.report};const report=JSON.parse(await readFile(path.join(directory,id+'.json'),'utf8'));if(report.schema!=='framefuzz.investigation.v1')throw new Error('Invalid saved investigation');return {id,state:'FINISHED',timeline:report.timeline,report};};
 return async(req,res,url)=>{
  if(!url.pathname.startsWith('/api/swarm/'))return false;
  const enabled=env.FRAMEFUZZ_SWARM==='on',provider=openRouterStatus(env);
  if(req.method==='GET'&&url.pathname==='/api/swarm/config'){json(res,200,{enabled,provider,canCallProvider:enabled&&provider.configured&&!offlineDemo,offlineDemo,executionClass:'OFFLINE_SIGNATURE_BINDING',liveWrites:false,running:getRunning()});return true;}
  if(!enabled){json(res,409,{error:'Swarm disabled; set FRAMEFUZZ_SWARM=on explicitly'});return true;}
  if(req.method==='GET'&&url.pathname==='/api/swarm/recent'){
   const items=[];try{for(const name of (await readdir(directory)).filter(n=>n.endsWith('.json')&&ID.test(n.slice(0,-5))).slice(-30)){try{const r=JSON.parse(await readFile(path.join(directory,name),'utf8'));if(r.schema==='framefuzz.investigation.v1')items.push({id:name.slice(0,-5),generatedAt:r.generatedAt,source:r.source,status:r.status,model:r.provider?.model??null});}catch{}}}catch{}
   json(res,200,{investigations:items.sort((a,b)=>String(b.generatedAt).localeCompare(String(a.generatedAt))).slice(0,10)});return true;
  }
  if(req.method==='GET'&&['/api/swarm/transcript','/api/swarm/export'].includes(url.pathname)){
   try{const job=await load(url.searchParams.get('id'));if(url.pathname.endsWith('/export')){if(!job.report){json(res,409,{error:'Investigation has not finished'});return true;}const format=url.searchParams.get('format')??'json';if(!['json','regression'].includes(format)){json(res,400,{error:'Unknown export format'});return true;}const data=format==='regression'?{schema:'framefuzz.investigation-regressions.v1',source:job.report.source,executionClass:job.report.executionClass,descriptors:job.report.experiments.map(e=>e.execution.descriptor)}:job.report;json(res,200,data);}else json(res,200,job);}catch{json(res,404,{error:'Investigation not found'});}return true;
  }
  if(req.method==='POST'&&url.pathname==='/api/swarm/run'){
   if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host){json(res,403,{error:'Invalid Origin'});return true;}
   if(getRunning()){json(res,409,{error:'An experiment is already running'});return true;}
   let input='';for await(const chunk of req){input+=chunk;if(input.length>1024){json(res,413,{error:'Selection too large'});return true;}}
   let selection;try{selection=JSON.parse(input);if(!selection||typeof selection!=='object'||Array.isArray(selection)||Object.keys(selection).some(k=>!['mode','authorizeProvider'].includes(k))||!['simulated','openrouter'].includes(selection.mode))throw new Error();}catch{json(res,400,{error:'Only mode and explicit provider authorization are accepted; no blockchain options'});return true;}
   if(selection.mode==='openrouter'&&(!provider.configured||offlineDemo||selection.authorizeProvider!==true)){json(res,409,{error:'Real model calls require normal server mode, configured OpenRouter credentials and explicit provider authorization'});return true;}
   if(jobs.size>=10){const old=[...jobs].find(([,j])=>j.state!=='RUNNING');if(old)jobs.delete(old[0]);else{json(res,429,{error:'Investigation limit reached'});return true;}}
   const id=randomUUID(),job={state:'RUNNING',timeline:[],report:null};jobs.set(id,job);setRunning(true);
   json(res,202,{id,state:'RUNNING',executionClass:'OFFLINE_SIGNATURE_BINDING',liveWrites:false});
   setImmediate(async()=>{try{
    const run=runner??(await import('./investigate.mjs')).investigate;
    const providerInstance=selection.mode==='openrouter'&&!runner?new (await import('./provider.mjs')).OpenRouterProvider({env}):undefined;
    job.report=await run({mode:selection.mode,authorizeProvider:selection.authorizeProvider===true,provider:providerInstance,onEvent:e=>job.timeline.push(e)});
    await mkdir(directory,{recursive:true});await writeFile(path.join(directory,id+'.json'),JSON.stringify(job.report,null,2)+'\n');job.state='FINISHED';
   }catch{job.state='FAILED';job.timeline.push({stage:'ERROR',message:'Investigation failed; no blockchain transaction was sent'});}finally{setRunning(false);}});
   return true;
  }
  json(res,404,{error:'Unknown swarm route'});return true;
 };
}
