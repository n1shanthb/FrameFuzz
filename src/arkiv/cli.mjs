import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {arkivClients} from './client.mjs';
import {createRegistry} from './registry.mjs';
import {sha256} from './case.mjs';
import {saveReport} from '../reports.mjs';
export const stringify=value=>JSON.stringify(value,(_,v)=>typeof v==='bigint'?String(v):v,2);
export async function arkivCommand(options){
  const action=options._[0],registry=createRegistry({...arkivClients({readOnly:action!=='publish'})});
  let result;
  if(action==='publish'){
    if(!options._[1])throw new Error('Publish requires a generated campaign JSON file');
    const raw=await readFile(options._[1]);
    result=await registry.publish({report:JSON.parse(raw),evidenceDigest:sha256(raw),caseIndex:Number(options['case-index']??0),expirationBlocks:Number(options['expiration-blocks']??43200),submit:options.submit===true});
  }else{
    if(options.submit)throw new Error('Only Arkiv publish permits --submit; community imports are preview only');
    if(action==='query')result=await registry.query({suite:options.suite,ruleId:options.rule,implementation:options.implementation,owner:options.owner,limit:Number(options.limit??20)});
    else if(action==='fetch')result=await registry.fetch(options.key);
    else if(action==='import'){
      const imported=await registry.importPreview(options.key);
      result={...imported,saved:await saveReport(imported.preview,options.results??'runs')};
    }else throw new Error('Arkiv action must be publish, query, fetch or import');
  }
  if(options.output){await mkdir(path.dirname(options.output),{recursive:true});await writeFile(options.output,stringify(result)+'\n');}
  console.log(stringify(result));
}
