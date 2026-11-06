#!/usr/bin/env node
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import solc from 'solc';
import {keccak256} from 'viem';

const sourcePath='vendor/paymaster/ReserveReadingPaymaster.sol';
const source=await readFile(sourcePath,'utf8');
const artifact=JSON.parse(await readFile('vendor/paymaster/ReserveReadingPaymaster.json','utf8'));
const resolveImport=name=>{for(const candidate of [path.resolve('node_modules',name),path.resolve('vendor/paymaster',name)]){try{return {contents:readFileSync(candidate,'utf8')}}catch{}}return {error:`Import not found: ${name}`};};
const variants=[{optimizer:{enabled:false,runs:200}},{optimizer:{enabled:true,runs:200}},{optimizer:{enabled:true,runs:1000000}}];
const results=[];let selected=null;
for(const settings of variants){
 const input={language:'Solidity',sources:{[sourcePath]:{content:source}},settings:{optimizer:settings.optimizer,outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object','metadata']}}}};
 const output=JSON.parse(solc.compile(JSON.stringify(input),{import:resolveImport}));
 const errors=(output.errors??[]).filter(x=>x.severity==='error');if(errors.length)throw Error(errors.map(x=>x.formattedMessage).join('\n'));
 const c=output.contracts[sourcePath].ReserveReadingPaymaster,bytecode=`0x${c.evm.bytecode.object}`,runtime=`0x${c.evm.deployedBytecode.object}`;
 if(settings.optimizer.enabled&&settings.optimizer.runs===200)selected={schema:'framefuzz.compiled-contract.v1',contractName:'ReserveReadingPaymaster',sourcePath,sourceSha256:(await import('node:crypto')).createHash('sha256').update(source).digest('hex'),compiler:solc.version(),settings,abi:c.abi,bytecode,deployedBytecodeTemplate:runtime,metadata:JSON.parse(c.metadata)};
 results.push({compiler:solc.version(),optimizer:settings.optimizer,creationBytes:(bytecode.length-2)/2,runtimeBytes:(runtime.length-2)/2,creationHash:keccak256(bytecode),runtimeTemplateHash:keccak256(runtime),matchesSuppliedArtifact:bytecode.toLowerCase()===artifact.bytecode.toLowerCase()});
}
await mkdir('artifacts/step2e',{recursive:true});
await writeFile('artifacts/step2e/ReserveReadingPaymaster.json',JSON.stringify(selected,null,2)+'\n');
console.log(JSON.stringify({sourcePath,suppliedArtifact:{creationBytes:(artifact.bytecode.length-2)/2,creationHash:keccak256(artifact.bytecode)},variants:results},null,2));
