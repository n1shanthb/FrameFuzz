import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {extractFacts} from './facts.mjs';
if(!isMainThread){
 try{
  const {default:solc}=await import('solc');
  const input={language:'Solidity',sources:{'UserInput.sol':{content:workerData.source}},settings:{outputSelection:{'*':{'':['ast'],'*':['abi']}}}};
  const raw=solc.compile(JSON.stringify(input),{import:()=>({error:'Imports are disabled; provide a self-contained source file. No filesystem or URL lookup is permitted.'})});
  if(Buffer.byteLength(raw)>4*1024*1024)throw Error('COMPILER_OUTPUT_LIMIT');
  parentPort.postMessage(extractFacts(workerData,JSON.parse(raw),solc.version()));
 }catch(e){parentPort.postMessage({status:'RESOURCE_ERROR',error:/LIMIT/.test(e.message)?e.message:'COMPILER_WORKER_FAILED'});}
}else{
 let data='';for await(const chunk of process.stdin){data+=chunk;if(Buffer.byteLength(data)>100000)process.exit(12);}
 let input;try{input=JSON.parse(data);}catch{process.exit(13);}
 const worker=new Worker(new URL(import.meta.url),{workerData:input,resourceLimits:{maxOldGenerationSizeMb:192,maxYoungGenerationSizeMb:32,stackSizeMb:4}});
 // The main thread stays responsive while compilation runs in the worker.
 const monitor=setInterval(()=>{if(process.memoryUsage().rss>384*1024*1024)process.exit(14);},20);
 worker.once('message',result=>{const out=JSON.stringify(result);if(Buffer.byteLength(out)>1024*1024)process.exit(15);clearInterval(monitor);process.stdout.write(out,()=>process.exit(0));});
 worker.once('error',()=>process.exit(16));worker.once('exit',code=>{if(code)process.exit(17);});
}
