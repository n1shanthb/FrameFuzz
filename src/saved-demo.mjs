import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
export const SAVED_DEMO_FILES=[
  'evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json',
  'evidence/live/2026-11-06/2026-11-05T22-04-27-896Z-LIVE_RPC_SUBMISSION-3a838bca.json',
  'evidence/arkiv/2026-11-06/dashboard-preview.json',
];
export async function prepareSavedDemo(directory){
  await mkdir(directory,{recursive:true});const files=[];
  for(const file of SAVED_DEMO_FILES){const bytes=await readFile(new URL('../'+file,import.meta.url));const report=JSON.parse(bytes);if(report.schema!=='framefuzz.evidence.v1')throw new Error('Invalid saved demo evidence');const name=file.includes('/arkiv/')?'saved-arkiv-import-preview.json':path.basename(file);await writeFile(path.join(directory,name),bytes);files.push(name);}
  return {files,defaultRun:files[0],mode:'SAVED_EVIDENCE_OFFLINE',notice:'Historical LIVE captures and saved PREVIEW only. No fresh network execution or current Arkiv availability is implied.'};
}
