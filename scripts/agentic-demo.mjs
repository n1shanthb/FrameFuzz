import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {investigate} from '../src/swarm/investigate.mjs';
import {OpenRouterProvider} from '../src/swarm/provider.mjs';
const args=process.argv.slice(2),retry=args.includes('--retry-incomplete'),third=args.includes('--authorized-third-attempt'),fourth=args.includes('--authorized-fourth-attempt');
if(!['--authorize-provider','--authorize-provider --retry-incomplete','--authorize-provider --authorized-third-attempt','--authorize-provider --authorized-fourth-attempt'].includes(args.join(' ')))throw Error('Explicit --authorize-provider required: bounded remaining authorized calls / cumulative $0.50; no chain writes');
// Read the existing local credential only. Never load unrelated .env credentials into process.env or model data.
const local=parseEnv(await readFile(new URL('../.env',import.meta.url),'utf8'));
const env={OPENROUTER_API_KEY:process.env.OPENROUTER_API_KEY??local.OPENROUTER_API_KEY,OPENROUTER_MODEL:'anthropic/claude-sonnet-4.6'};
if(!env.OPENROUTER_API_KEY)throw Error('OPENROUTER_API_KEY missing; no request sent');
const directory=new URL('../evidence/investigator/2026-11-06/',import.meta.url),file=new URL(fourth?'feasibility-sonnet-4.json':third?'feasibility-sonnet-3.json':retry?'feasibility-sonnet-2.json':'feasibility-sonnet.json',directory);
let previousCost=0,previousCalls=0;
if(retry||third||fourth){for(const name of fourth?['feasibility-sonnet.json','feasibility-sonnet-2.json','feasibility-sonnet-3.json']:third?['feasibility-sonnet.json','feasibility-sonnet-2.json']:['feasibility-sonnet.json']){const prior=JSON.parse(await readFile(new URL(name,directory),'utf8'));if(prior.status!=='INCOMPLETE')throw Error('Only incomplete attempts may be retried');if(!Number.isFinite(prior.provider.costUSD)||!Number.isSafeInteger(prior.provider.calls))throw Error('Unknown prior budget');previousCost+=prior.provider.costUSD;previousCalls+=prior.provider.calls;}if(previousCost>=0.5)throw Error('Cumulative budget exhausted');}
try{await readFile(file);throw Error('Real demonstration already exists; refusing overwrite or another paid run');}catch(e){if(e.code!=='ENOENT')throw e;}
const maxCalls=Math.min(6,(third||fourth?12:6)-previousCalls);
if(maxCalls<1)throw Error('Cumulative authorized call budget exhausted');
const provider=new OpenRouterProvider({env,limits:{maxCostUSD:0.5-previousCost,maxCalls}});
const report=await investigate({mode:'openrouter',authorizeProvider:true,provider,onEvent:e=>console.log(e.stage)});
await mkdir(directory,{recursive:true});await writeFile(file,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output:file.pathname,status:report.status,error:report.error,calls:report.provider.calls,validatedCalls:report.realLLMCalls,accountedCostUSD:report.provider.costUSD,reportedCostUSD:report.provider.requests.reduce((n,r)=>n+(r.costUSD??0),0),unknownCostRequests:report.provider.requests.filter(r=>r.costUSD===undefined).length,proposals:report.proposals.map(p=>({id:p.id,revision:p.revision,state:p.state,feasibility:p.feasibility?.decision,outcomes:p.outcomes})),executions:report.experiments.length,broadcasts:report.broadcasts},null,2));
if(report.status==='INCOMPLETE')process.exitCode=2;
