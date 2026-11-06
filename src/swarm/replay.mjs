import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
export async function independentlyReplay(descriptor,{timeoutMs=20000}={}){
 const input=JSON.stringify(descriptor);if(input.length>65536)throw new Error('Descriptor too large');
 return new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[fileURLToPath(new URL('./replay-worker.mjs',import.meta.url))],{cwd:fileURLToPath(new URL('../../',import.meta.url)),windowsHide:true,stdio:['pipe','pipe','pipe'],env:{FRAMEFUZZ_SWARM:'on',...(process.env.SystemRoot?{SystemRoot:process.env.SystemRoot}:{})}});
  let stdout='',done=false;const stop=(error,result)=>{if(done)return;done=true;clearTimeout(timer);if(error){child.kill();reject(error);}else resolve(result);};
  const timer=setTimeout(()=>stop(new Error('Independent replay timeout')),timeoutMs);
  child.on('error',()=>stop(new Error('Independent process unavailable')));child.stdin.on('error',()=>{});
  child.stdout.on('data',chunk=>{stdout+=chunk;if(stdout.length>65536)stop(new Error('Independent output too large'));});
  child.stderr.on('data',()=>{});child.on('close',code=>{if(done)return;if(code!==0)return stop(new Error('Independent replay rejected descriptor/source/properties'));try{const r=JSON.parse(stdout);if(r.pid===process.pid||r.descriptorDigest!==descriptor.contentDigest||r.equivalentSemanticProperties!==true||r.sourceHashesVerified!==true||r.finding!==false)throw new Error();stop(null,r);}catch{stop(new Error('Invalid independent replay evidence'));}});
  child.stdin.end(input);
 });
}
