import {readFile,readdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import solc from 'solc';
import {assertSwarmEnabled} from './gate.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const packageRoot=path.dirname(createRequire(import.meta.url).resolve('@forshtat/hegota-support/package.json'));
export const FIXTURES=['SenderValidatorUnsafe','SenderValidatorSafe','ActionRecorder'];
const sha=x=>createHash('sha256').update(x).digest('hex');
const cache=new Map();
export async function compileOwnedFixtures(){
  assertSwarmEnabled();
  if(!solc.version().startsWith('0.8.28+'))throw new Error('Exact solc 0.8.28 compiler required');
  const sources={};
  for(const name of [...FIXTURES,'OwnedValidatorBase'])sources[`contracts/${name}.sol`]={content:await readFile(path.join(root,'contracts',name+'.sol'),'utf8')};
  async function imports(dir,prefix){for(const e of await readdir(dir,{withFileTypes:true})){if(e.isDirectory())await imports(path.join(dir,e.name),prefix+e.name+'/');else if(e.name.endsWith('.sol'))sources[prefix+e.name]={content:await readFile(path.join(dir,e.name),'utf8')};}}
  await imports(path.join(packageRoot,'contracts'),'@forshtat/hegota-support/contracts/');
  const settings={optimizer:{enabled:true,runs:200},evmVersion:'cancun',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object','evm.deployedBytecode.immutableReferences']}}};
  const input={language:'Solidity',sources,settings},inputDigest=sha(JSON.stringify(input));
  if(cache.has(inputDigest))return structuredClone(cache.get(inputDigest));
  const output=JSON.parse(solc.compile(JSON.stringify(input)));
  const errors=(output.errors??[]).filter(e=>e.severity==='error');if(errors.length)throw new Error(errors.map(e=>e.formattedMessage).join('\n'));
  const artifacts={};for(const name of FIXTURES){const c=output.contracts?.[`contracts/${name}.sol`]?.[name];if(!c?.evm.bytecode.object)throw new Error('Missing owned fixture artifact '+name);artifacts[name]={contract:name,source:`contracts/${name}.sol`,abi:c.abi,bytecode:'0x'+c.evm.bytecode.object,deployedBytecode:'0x'+c.evm.deployedBytecode.object,immutableReferences:c.evm.deployedBytecode.immutableReferences};}
  const result={schema:'framefuzz.swarm-compilation.v1',compiler:solc.version(),inputDigest,settings,sourceDigests:Object.fromEntries(Object.entries(sources).map(([name,s])=>[name,sha(s.content)])),artifacts};
  cache.set(inputDigest,result);return structuredClone(result);
}
