import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
function loadEnv(text){for(const line of text.split(/\r?\n/)){const t=line.trim();if(!t||t.startsWith('#')||!t.includes('='))continue;const i=t.indexOf('=');const k=t.slice(0,i).trim();let v=t.slice(i+1).trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);if(!(k in process.env))process.env[k]=v;}}
loadEnv(await readFile('.env','utf8'));
await mkdir('runs/paid-sprint',{recursive:true});
const envKeys=['ARKIV_PRIVATE_KEY','ARKIV_ACCESS_KEY','ARKIV_READER_ADDRESS','FRAMEFUZZ_DEPLOYER_KEY','FRAMEFUZZ_RPC','FRAMEFUZZ_PUBLIC_RPC','FRAMEFUZZ_ALT_RPC','FRAMEFUZZ_LIVE_CONFIG','OPENROUTER_API_KEY'];
const envPresence=Object.fromEntries(envKeys.map(k=>[k,Boolean(process.env[k])]));
const arkiv={status:'ARKIV_PUBLICATION_BLOCKED',chainId:7794095,rpc:'https://rpc.rabdi.db-chain.testnet.arkiv.network',writerConfigured:Boolean(process.env.ARKIV_PRIVATE_KEY),historicalEntities:[
  {entityKey:'0x6779cf38a4398eb90da94b11885e691b84a6bb09dda59974cf5b8f1a21db773e',note:'Historical Uniswap regression preview import evidence'},
],blockers:[],manifest:null};
if(!process.env.ARKIV_PRIVATE_KEY)arkiv.blockers.push('ARKIV_PRIVATE_KEY not configured for a funded Rabdi-only writer');
arkiv.blockers.push('No separate explicit user approval of an exact Arkiv publication transaction manifest for this sprint');
const byoc=JSON.parse(await readFile('runs/paid-sprint/byoc-paid-report.json','utf8'));
arkiv.manifest={schema:'framefuzz.arkiv-publish-manifest.v1',status:'DRAFT_NOT_AUTHORIZED',submit:false,sourceInvestigation:byoc.report?.id,sourceDigest:byoc.report?.sourceDigest,contentDigest:byoc.report?.contentDigest,contractName:byoc.report?.contractName,publisher:'UNRESOLVED',expirationBlocks:43200,notice:'Preview only. Publishing requires funded writer + explicit approval of this exact manifest.'};
const eip={status:'FRESH_EIP8141_BLOCKED_EXTERNAL',chainId:1337,endpoints:['https://altmempool.forshtat.com/rpc','https://altmempool.forshtat.com'],blockers:[],observations:[]};
try{
 const chain=await fetch('https://altmempool.forshtat.com/rpc',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_chainId',params:[]}),signal:AbortSignal.timeout(8000)}).then(r=>r.json());
 eip.observations.push({method:'eth_chainId',result:chain.result});
 if(Number(BigInt(chain.result))!==1337)eip.blockers.push('Unexpected chain id '+chain.result);
}catch(e){eip.blockers.push('Gateway eth_chainId failed: '+e.message);}
try{
 const block=await fetch('https://altmempool.forshtat.com',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_getBlockByNumber',params:['latest',false]}),signal:AbortSignal.timeout(8000)}).then(r=>r.json());
 const ts=block.result?.timestamp?Number(BigInt(block.result.timestamp)):null;const age=ts?Math.floor(Date.now()/1000)-ts:null;
 eip.observations.push({method:'eth_getBlockByNumber',number:block.result?.number??null,ageSeconds:age});
 if(age===null||age>300)eip.blockers.push('Execution head missing or stale (ageSeconds='+age+')');
}catch(e){eip.blockers.push('eth_getBlockByNumber failed: '+e.message);}
if(!process.env.FRAMEFUZZ_DEPLOYER_KEY)eip.blockers.push('FRAMEFUZZ_DEPLOYER_KEY missing; no owned fresh signing');
eip.blockers.push('No separate explicit approval of an exact EIP-8141 broadcast manifest for this sprint');
eip.historicalEvidence='evidence/live/2026-11-06/2026-11-05T22-04-27-896Z-LIVE_RPC_SUBMISSION-3a838bca.json';
eip.historicalAltInclusion='0xbb9143eb2964bdc4de9d59f15404baf14f59465f0ac0f5d5903dfa0173741b6c';
const out={generatedAt:new Date().toISOString(),envPresence,arkiv,eip8141:eip};
await writeFile('runs/paid-sprint/preflight-blockers.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out,null,2));
