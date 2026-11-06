import {writeFile,readFile} from 'node:fs/promises';
import {briefingFacts} from '../src/briefing-facts.mjs';
const text='// Generated from immutable evidence and docs/TEST_CHECKPOINT.json.\nexport const EVIDENCE_FACTS = '+JSON.stringify(await briefingFacts(),null,2)+';\n';
const file=new URL('../web/js/evidence-facts.js',import.meta.url);
if(process.argv.includes('--check')){if(await readFile(file,'utf8')!==text)throw new Error('Briefing facts stale: run node scripts/briefing-facts.mjs');console.log('Briefing facts match canonical evidence and test checkpoint');}
else await writeFile(file,text);
