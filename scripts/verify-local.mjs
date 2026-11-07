import {readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
async function walk(dir){const files=[];for(const entry of await readdir(dir,{withFileTypes:true})){const path=`${dir}/${entry.name}`;if(entry.isDirectory())files.push(...await walk(path));else if(/\.(mjs|js)$/.test(path))files.push(path);}return files;}
const files=(await Promise.all(['src','bin','scripts','web/js'].map(walk))).flat();
for(const file of files){const result=spawnSync(process.execPath,['--check',file],{stdio:'inherit',windowsHide:true});if(result.status!==0)process.exit(result.status??1);}
console.log(`Syntax verified: ${files.length} JavaScript modules. No network or writes.`);
const facts=spawnSync(process.execPath,['scripts/briefing-facts.mjs','--check'],{stdio:'inherit',windowsHide:true});
if(facts.status!==0)process.exit(facts.status??1);
