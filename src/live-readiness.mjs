import {createHash} from 'node:crypto';
import {ARKIV_CHAIN_ID,ARKIV_RPC} from './arkiv/client.mjs';

export const CAPABILITY_MODES=Object.freeze({
  SAVED_DEMO:'SAVED_DEMO',
  LIVE_READ_ONLY:'LIVE_READ_ONLY',
  LIVE_AUTHORIZED:'LIVE_AUTHORIZED',
});
export const STAGE_A_OPERATIONS=Object.freeze({
  ARKIV_PUBLISH:'ARKIV_PUBLISH',
  EIP8141_UNISWAP_COMPARE:'EIP8141_UNISWAP_COMPARE',
});
const EIP8141_RPC='https://altmempool.forshtat.com/rpc';
const stable=value=>Array.isArray(value)?`[${value.map(stable).join(',')}]`:value&&typeof value==='object'?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`:JSON.stringify(value);
const digest=value=>createHash('sha256').update(stable(value)).digest('hex');
const present=(env,name)=>typeof env[name]==='string'&&env[name].trim().length>0;

export function capabilityModel({offlineDemo=false,requestedMode,env=process.env}={}){
  const requested=requestedMode??(offlineDemo?'SAVED_DEMO':'LIVE_READ_ONLY');
  if(!Object.values(CAPABILITY_MODES).includes(requested))throw new Error(`Invalid capability mode ${requested}`);
  if(offlineDemo&&requested!==CAPABILITY_MODES.SAVED_DEMO)throw new Error('Saved demo is irrevocably SAVED_DEMO');
  const mode=offlineDemo?CAPABILITY_MODES.SAVED_DEMO:requested;
  return {
    mode,
    savedEvidence: true,
    readOnlyNetwork: mode!==CAPABILITY_MODES.SAVED_DEMO,
    paidProviderCalls: false,
    writesEnabled: false,
    approvalPolicy:'OPERATION_AND_MANIFEST_SPECIFIC_ONE_TIME',
    stage:'A_STOPPED_AT_APPROVAL',
    credentials:{
      OPENROUTER_API_KEY:present(env,'OPENROUTER_API_KEY'),
      ARKIV_PRIVATE_KEY:present(env,'ARKIV_PRIVATE_KEY'),
      ARKIV_ACCESS_KEY:present(env,'ARKIV_ACCESS_KEY'),
      ARKIV_READER_ADDRESS:present(env,'ARKIV_READER_ADDRESS'),
      FRAMEFUZZ_DEPLOYER_KEY:present(env,'FRAMEFUZZ_DEPLOYER_KEY'),
      FRAMEFUZZ_RPC:present(env,'FRAMEFUZZ_RPC'),
      FRAMEFUZZ_PUBLIC_RPC:present(env,'FRAMEFUZZ_PUBLIC_RPC'),
      FRAMEFUZZ_ALT_RPC:present(env,'FRAMEFUZZ_ALT_RPC'),
      FRAMEFUZZ_LIVE_CONFIG:present(env,'FRAMEFUZZ_LIVE_CONFIG'),
    },
    notice:mode===CAPABILITY_MODES.SAVED_DEMO
      ? 'Keys are ignored. Network reads, paid calls and writes are permanently disabled for this process.'
      : 'Key presence reports readiness only. It never enables paid calls or writes.',
  };
}

export function prepareStageAManifest(operation,{env=process.env,sourceReport='evidence/playground/2026-11-06/byoc-paid-report.json'}={}){
  if(!Object.values(STAGE_A_OPERATIONS).includes(operation))throw new Error('Unsupported Stage A operation');
  const base={schema:'framefuzz.stage-a-manifest.v1',operation,status:'AWAITING_EXPLICIT_APPROVAL',oneTime:true,authorized:false,submitted:false};
  const details=operation===STAGE_A_OPERATIONS.ARKIV_PUBLISH?{
    chainId:ARKIV_CHAIN_ID,rpc:ARKIV_RPC,action:'create immutable readonly regression entity',sourceReport,caseIndex:0,expirationBlocks:43200,
    writer:present(env,'ARKIV_PRIVATE_KEY')?'DERIVE_AT_SIGNING_AFTER_APPROVAL':'UNRESOLVED',
    pathway:['prepare','approve','submit','reconcile','query','verify','import'],
    stopAfter:'approve',blockedBy:['Exact manifest has not received separate user approval','Stage A does not issue an approval token or submit'],
  }:{
    chainId:1337,rpc:env.FRAMEFUZZ_ALT_RPC??env.FRAMEFUZZ_RPC??EIP8141_RPC,
    action:'first fresh Uniswap v4 paymaster public/alternative admission comparison',
    scenario:'uniswap-v4-paymaster',case:'basic-sponsorship-smallest-historical-profile',maxVariants:1,
    methods:{public:'eth_sendRawTransaction',alternative:'eth_sendFrameTransaction'},
    expected:{public:'accepted',alternative:'accepted'},receiptWaitMs:5000,
    pathway:['inspect','prepare','approve','broadcast','reconcile','verify'],
    stopAfter:'approve',blockedBy:['FRAMEFUZZ_DEPLOYER_KEY must be a funded devnet-only key','Exact manifest has not received separate user approval','Stage A does not sign or broadcast'],
  };
  const manifest={...base,...details};
  return {...manifest,manifestDigest:digest(manifest)};
}

async function rpcProbe(fetchImpl,url,method,timeoutMs){
  const response=await fetchImpl(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params:method==='eth_getBlockByNumber'?['latest',false]:[]}),signal:AbortSignal.timeout(timeoutMs)});
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const body=await response.json();
  if(body.error)throw new Error(body.error.message??'RPC error');
  return body.result;
}
export async function boundedReadinessProbe({mode,fetchImpl=fetch,timeoutMs=3000}={}){
  if(mode===CAPABILITY_MODES.SAVED_DEMO)return {mode,probes:[],status:'SAVED_DEMO_NETWORK_DISABLED',paidCalls:0,writes:0};
  if(!Number.isSafeInteger(timeoutMs)||timeoutMs<100||timeoutMs>5000)throw new Error('Probe timeout must be 100–5000 ms');
  const probes=[];
  for(const [id,url,expected] of [['arkiv',ARKIV_RPC,ARKIV_CHAIN_ID],['eip8141',EIP8141_RPC,1337]]){
    try{
      const raw=await rpcProbe(fetchImpl,url,'eth_chainId',timeoutMs),chainId=Number.parseInt(raw,16);
      probes.push({id,status:chainId===expected?'READY_READ_ONLY':'CHAIN_MISMATCH',chainId,expectedChainId:expected});
    }catch(error){probes.push({id,status:'UNAVAILABLE',message:String(error.message).slice(0,160)});}
  }
  return {mode,status:probes.every(p=>p.status==='READY_READ_ONLY')?'READ_ONLY_READY':'READ_ONLY_PARTIAL',probes,paidCalls:0,writes:0};
}

export function approvalStop(manifestDigest,operation){
  if(!/^[\da-f]{64}$/.test(manifestDigest??'')||!Object.values(STAGE_A_OPERATIONS).includes(operation))throw new Error('Approval request must identify one exact Stage A manifest');
  return {status:'AWAITING_SEPARATE_USER_APPROVAL',operation,manifestDigest,approvalIssued:false,consumed:false,oneTime:true,
    notice:'Stage A stops here. No signing, paid provider request, publication or broadcast occurred.'};
}
