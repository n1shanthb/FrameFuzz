import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
export const SAVED_DEMO_FILES=[
  'evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json',
  'evidence/live/2026-11-06/2026-11-05T22-04-27-896Z-LIVE_RPC_SUBMISSION-3a838bca.json',
  'evidence/arkiv/2026-11-06/dashboard-preview.json',
];
export async function prepareSavedDemo(directory){
  await mkdir(directory,{recursive:true});const files=[];
  for(const file of SAVED_DEMO_FILES){const bytes=await readFile(new URL('../'+file,import.meta.url));const report=JSON.parse(bytes);if(report.schema!=='framefuzz.evidence.v1')throw new Error('Invalid saved demo evidence');const name=file.includes('/arkiv/')?'saved-arkiv-import-preview.json':path.basename(file);await writeFile(path.join(directory,name),bytes);files.push(name);}
  const investigation = await readFile(new URL('../evidence/investigator/2026-11-06/sonnet-retry-2.json',import.meta.url));
  const parsed = JSON.parse(investigation);
  if(parsed.schema!=='framefuzz.investigation.v1')throw new Error('Invalid saved investigation');
  await mkdir(path.join(directory,'swarm'),{recursive:true});
  await writeFile(path.join(directory,'swarm','2a910262-9dcd-4261-b661-d245a7d20122.json'),investigation);
  const manifest=JSON.parse(await readFile(new URL('../evidence/investigator/2026-11-06/feasibility-manifest.json',import.meta.url),'utf8'));
  const entry=manifest.entries.find(e=>e.file==='evidence/investigator/2026-11-06/feasibility-sonnet-4.json');
  const agentic=await readFile(new URL('../evidence/investigator/2026-11-06/feasibility-sonnet-4.json',import.meta.url));
  const saved=JSON.parse(agentic);if(createHash('sha256').update(agentic).digest('hex')!==entry?.sha256||saved.pipelineVersion!=='framefuzz.agentic-feasibility.v1'||saved.status!=='COMPLETE_OFFLINE_INVESTIGATION')throw Error('Saved agentic demonstration integrity mismatch');
  const agenticInvestigation='d302f6c9-4944-4f74-b721-79c0836a7929';await writeFile(path.join(directory,'swarm',agenticInvestigation+'.json'),agentic);
  return {files,investigation:'2a910262-9dcd-4261-b661-d245a7d20122',agenticInvestigation,defaultRun:files[0],mode:'SAVED_EVIDENCE_OFFLINE',notice:'Historical LIVE captures and saved PREVIEW only. No fresh network execution or current Arkiv availability is implied.'};
}
