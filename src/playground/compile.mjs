import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {boundedJSON,keys,sha256} from '../analysis/model.mjs';
export const COMPILE_LIMITS={sourceBytes:65536,abiBytes:32768,timeoutMs:8000,heapMiB:192,rssMiB:384,outputBytes:1048576,concurrency:2};
let active=0;
export function validateIntake(input){
 boundedJSON(input,100000);keys(input,['source','abi','contractName','role']);
 if(typeof input.source!=='string'||!input.source.trim()||Buffer.byteLength(input.source)>COMPILE_LIMITS.sourceBytes)throw Error('Source must be nonempty and at most64 KiB');
 if(input.contractName!==undefined&&!/^[A-Za-z_$][\w$]{0,100}$/.test(input.contractName))throw Error('Invalid contract selection');
 if(input.role!==undefined&&!['UNKNOWN','EXECUTION_TARGET','SENDER_VALIDATOR','PAYMASTER'].includes(input.role))throw Error('Unsupported declared role');
 if(input.abi!==undefined&&(!Array.isArray(input.abi)||input.abi.length>128||Buffer.byteLength(JSON.stringify(input.abi))>COMPILE_LIMITS.abiBytes))throw Error('ABI must be a bounded array');
 // Refuse obvious credential-bearing source before saving it or sending facts to a provider.
 if(/sk-or-[\w-]{12,}|-----BEGIN [\w ]*PRIVATE KEY|(?:private[_ ]?key|mnemonic|password)\s*[=:]\s*["']?[\da-f]{64}/i.test(input.source))throw Error('SECRET_LIKE_SOURCE: remove credential material before intake');
 return structuredClone(input);
}
export async function analyzeContract(raw,{signal,timeoutMs=COMPILE_LIMITS.timeoutMs}={}){
 const input=validateIntake(raw);if(signal?.aborted)throw Error('CANCELLED');
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>COMPILE_LIMITS.timeoutMs)throw Error('Invalid compiler deadline');
 if(active>=COMPILE_LIMITS.concurrency)throw Error('COMPILER_BUSY');active++;
 try{return await new Promise((resolve,reject)=>{
  const env=Object.fromEntries(['PATH','SystemRoot','TEMP','TMP'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
  const child=spawn(process.execPath,['--max-old-space-size=192',fileURLToPath(new URL('./compiler-child.mjs',import.meta.url))],{stdio:['pipe','pipe','ignore'],windowsHide:true,env,shell:false});
  let output='',finished=false;const done=(error,result)=>{if(finished)return;finished=true;clearTimeout(timer);signal?.removeEventListener('abort',cancel);child.kill();error?reject(error):resolve(result);};
  const cancel=()=>done(Error('CANCELLED')),timer=setTimeout(()=>done(Error('COMPILER_TIMEOUT')),timeoutMs);signal?.addEventListener('abort',cancel,{once:true});
  child.stdout.on('data',chunk=>{output+=chunk;if(Buffer.byteLength(output)>COMPILE_LIMITS.outputBytes)done(Error('COMPILER_OUTPUT_LIMIT'));});
  child.on('error',()=>done(Error('COMPILER_START_FAILED')));
  child.on('close',code=>{if(finished)return;if(code!==0)return done(Error('COMPILER_RESOURCE_LIMIT (exit '+code+')'));try{const result=JSON.parse(output);if(result.sourceDigest&&result.sourceDigest!==sha256(input.source))throw Error();done(null,{...result,limits:COMPILE_LIMITS});}catch{done(Error('COMPILER_INVALID_OUTPUT'));}});
  child.stdin.on('error',()=>{});child.stdin.end(JSON.stringify(input));
 });}finally{active--;}
}
