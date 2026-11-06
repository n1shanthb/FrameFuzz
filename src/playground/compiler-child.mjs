import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {extractFacts} from './facts.mjs';

const require=createRequire(import.meta.url);
const HEGOTA_ROOT=path.dirname(require.resolve('@forshtat/hegota-support/package.json'));
const HEGOTA_PREFIX='@forshtat/hegota-support/contracts/';

function resolveHegotaImport(importPath){
  if(!importPath.startsWith(HEGOTA_PREFIX))return {error:'Imports are disabled except @forshtat/hegota-support/contracts/* for the storage-access validator interface.'};
  const rel=importPath.slice(HEGOTA_PREFIX.length).replace(/\\/g,'/');
  if(!rel||rel.includes('..')||path.isAbsolute(rel))return {error:'Invalid hegota import path'};
  const full=path.resolve(HEGOTA_ROOT,'contracts',rel);
  if(!full.startsWith(path.resolve(HEGOTA_ROOT,'contracts')+path.sep)&&full!==path.resolve(HEGOTA_ROOT,'contracts'))return {error:'Import escapes hegota contracts root'};
  try{return {contents:readFileSync(full,'utf8')};}
  catch{return {error:'Hegota support file not found: '+rel};}
}

if(!isMainThread){
 try{
  const {default:solc}=await import('solc');
  const wantBytecode=workerData.emitBytecode===true||workerData.role==='SENDER_VALIDATOR'||/ViolatingWallet|FOREIGN\.staticcall|StorageReadNonSender/i.test(workerData.source??'');
  const selection=wantBytecode?{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object']}:{'*':['abi']};
  const input={language:'Solidity',sources:{'UserInput.sol':{content:workerData.source}},settings:{optimizer:{enabled:true,runs:200},outputSelection:{'*':{'':['ast'],...selection}}}};
  const raw=solc.compile(JSON.stringify(input),{import:resolveHegotaImport});
  if(Buffer.byteLength(raw)>4*1024*1024)throw Error('COMPILER_OUTPUT_LIMIT');
  parentPort.postMessage(extractFacts(workerData,JSON.parse(raw),solc.version()));
 }catch(e){parentPort.postMessage({status:'RESOURCE_ERROR',error:/LIMIT|Import|hegota/i.test(e.message)?e.message:'COMPILER_WORKER_FAILED'});}
}else{
 let data='';for await(const chunk of process.stdin){data+=chunk;if(Buffer.byteLength(data)>100000)process.exit(12);}
 let input;try{input=JSON.parse(data);}catch{process.exit(13);}
 const worker=new Worker(fileURLToPath(import.meta.url),{workerData:input,resourceLimits:{maxOldGenerationSizeMb:192,maxYoungGenerationSizeMb:32,stackSizeMb:4}});
 const monitor=setInterval(()=>{if(process.memoryUsage().rss>384*1024*1024)process.exit(14);},20);
 worker.once('message',result=>{const out=JSON.stringify(result);if(Buffer.byteLength(out)>1024*1024)process.exit(15);clearInterval(monitor);process.stdout.write(out,()=>process.exit(0));});
 worker.once('error',()=>process.exit(16));worker.once('exit',code=>{if(code)process.exit(17);});
}
