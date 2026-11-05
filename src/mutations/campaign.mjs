import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createAdapter} from '../adapters/index.mjs';
import {workshopPlugin} from '../adapters/workshop-live.mjs';
import {runSuite} from '../runner.mjs';
import {rpc,sanitizedRpcLabel} from '../rpc.mjs';
import {redact} from '../safety.mjs';
import {mutationDefinition,generateMutations,regenerateMutation,GENERATOR_VERSION} from './generator.mjs';
import {compareMutation} from './oracle.mjs';

export const DEFAULT_CONFIG='examples/live/devnet.json';
export const DEFAULT_RULES='rules/devnet-1337.v1.json';
export const MAX_LIVE_MUTATIONS=7;

export async function loadMutationDefinition(options={}) {
  const rules=JSON.parse(await readFile(options.rulesFile??DEFAULT_RULES,'utf8'));
  // A declarative VERIFIED label alone does not suffice: require unchanged fixture evidence.
  for(const evidence of rules.provenance?.evidence??[]){
    try{const hash=createHash('sha256').update(await readFile(evidence.file)).digest('hex');if(hash!==evidence.sha256)rules.provenance.confidence='UNKNOWN';}
    catch{rules.provenance.confidence='UNKNOWN';}
  }
  if(options.definitionFile){const d=JSON.parse(await readFile(options.definitionFile,'utf8'));return {...d,ruleModel:rules};}
  return mutationDefinition({...options,rules});
}

export function mutationCoverage(results) {
  const rules={};
  for(const c of results)for(const p of c.paths){
    const key=`${p.oracle.ruleId}:${p.id}`;
    const item=rules[key]??={ruleId:p.oracle.ruleId,path:p.id,variants:0,verified:0,inferred:0,unknown:0,expectedAccept:0,expectedReject:0,matched:0,unexpected:0,preconditionFailures:0,regions:[]};
    item.variants++;item[p.oracle.confidence==='VERIFIED'?'verified':p.oracle.confidence==='INFERRED'?'inferred':'unknown']++;
    if(p.oracle.expected==='accepted')item.expectedAccept++;if(p.oracle.expected==='rejected')item.expectedReject++;
    if(p.comparison.verdict.startsWith('EXPECTED_'))item.matched++;
    if(p.comparison.verdict.startsWith('UNEXPECTED_'))item.unexpected++;
    if(p.comparison.verdict==='PRECONDITION_FAILURE')item.preconditionFailures++;
    const region=c.mutation.parameter.region;if(!item.regions.includes(region))item.regions.push(region);
  }
  return {generatorVersion:GENERATOR_VERSION,generatedVariants:results.length,decisions:results.reduce((n,c)=>n+c.paths.length,0),rules:Object.values(rules)};
}

export async function runMutationCampaign(options={}) {
  if(options.preview&&options.submit)throw new Error('--preview and --submit are mutually exclusive');
  const definition=options.definition??await loadMutationDefinition(options);
  let variants=generateMutations(definition);
  if(options.variant!==undefined){if(!Number.isSafeInteger(options.variant)||options.variant<0||options.variant>=variants.length)throw new Error('Invalid variant index');variants=variants.filter(v=>v.index===options.variant);}
  const submit=Boolean(options.submit);
  if(submit&&variants.length>MAX_LIVE_MUTATIONS)throw new Error(`Shared devnet submission limit is ${MAX_LIVE_MUTATIONS} variants per invocation; use preview for larger sweeps`);
  const config=options.config??JSON.parse(await readFile(options.configFile??DEFAULT_CONFIG,'utf8'));
  if(submit&&(options.allowChainId!==1337||config.chainId!==1337))throw new Error('Explicit --allow-chain 1337 required; mainnet and other chains are blocked');
  if(submit&&(definition.ruleModel.gas?.senderExecution!==30000||definition.ruleModel.gas?.signatureCost!==2800))throw new Error('Rule components do not match the existing workshop builder');
  const endpoints={public:options.rpcUrls?.public??options.rpcUrl??config.authorizedEndpoints[0],alt:options.rpcUrls?.alt??options.rpcUrl??config.authorizedEndpoints[0]};
  for(const v of variants){
    const kind=v.setup.configuration.kind,bindings=definition.ruleModel.provenance?.fixtureCodeHashes;
    if(bindings&&bindings[kind]!==config.paymasterCodeHashes?.[kind])for(const o of Object.values(v.oracle))Object.assign(o,{expected:null,confidence:'UNKNOWN',reason:'Configured sponsor code hash is not bound to the rule-model evidence'});
  }
  let network=null;
  if(submit&&!options.rpcFn){
    network={executionClient:await rpc(config.authorizedEndpoints[1]??endpoints.public,'web3_clientVersion'),sidecar:await rpc(endpoints.alt,'skandha_explorer_info')};
    const source=definition.ruleModel.provenance;
    if(!network.executionClient.includes(source?.executionCommit??'[unknown]')||network.sidecar.version!==source?.sidecarVersion)for(const v of variants)for(const o of Object.values(v.oracle))Object.assign(o,{expected:null,confidence:'UNKNOWN',reason:'Live client version differs from the rule-model evidence; expectations require reverification'});
  }
  // Create no keys and invoke no adapter/factory in an offline preview.
  const adapter=submit?(options.adapter??createAdapter(workshopPlugin(config))):null;
  const cases=variants.map(v=>({id:v.id,family:definition.suite,category:'Generated semantic mutation',description:`Seed ${definition.seed}, variant ${v.index}: ${JSON.stringify(v.parameter)}`,
    mutation:{generatorVersion:GENERATOR_VERSION,seed:v.seed,index:v.index,baseTemplateId:v.baseTemplateId,definitionDigest:v.definitionDigest,
      unsignedModel:v.unsignedModel,setup:v.setup,parameter:v.parameter},ruleProvenance:definition.ruleModel.provenance,
    reproduction:{...v.descriptor,network:{chainId:config.chainId,endpoints:Object.fromEntries(Object.entries(endpoints).map(([k,url])=>[k,sanitizedRpcLabel(url)])),configFile:options.configFile??DEFAULT_CONFIG,
      paymasters:config.paymasters,codeHashes:config.paymasterCodeHashes},rulesFile:options.rulesFile??DEFAULT_RULES},
    paths:definition.paths.map(id=>({id,method:id==='public'?'eth_sendRawTransaction':'eth_sendFrameTransaction',expected:v.oracle[id].expected,expectedRule:v.oracle[id].expectedRule,
      adapterMode:adapter?.mode??'LIVE',prepare:async context=>{
        if(v.oracle[id].precondition)throw new Error(v.oracle[id].precondition);
        return adapter.build({...context,caseId:v.id,pathId:id,setup:v.setup,model:v.unsignedModel});
      }}))}));
  let output;
  if(submit)output=await runSuite(cases,{rpcUrls:endpoints,allowChainId:options.allowChainId,submit:true,receiptWaitMs:options.receiptWaitMs??1000,rpcFn:options.rpcFn??rpc,evidenceSource:options.evidenceSource});
  else output={schema:'framefuzz.evidence.v1',generatedAt:new Date().toISOString(),source:'PREVIEW_GENERATED — NO RPC OR SIGNING',chainId:config.chainId,rpc:'[offline preview]',submissions:0,
    results:cases.map(c=>({...c,paths:c.paths.map(p=>({id:p.id,method:p.method,expected:p.expected,expectedRule:p.expectedRule,observed:{status:'inconclusive',message:'Offline preview: no signing, setup, RPC or submission'},receipt:{state:'not_checked'}}))}))};
  for(let i=0;i<output.results.length;i++){
    const result=output.results[i],v=variants[i];
    for(const p of result.paths){
      p.oracle=v.oracle[p.id];
      if(submit&&options.captureRules!==false&&p.id==='alt'&&output.source==='LIVE_RPC_SUBMISSION'&&p.metadata?.transaction?.hash){
        try{p.admissionReport=await (options.rpcFn??rpc)(endpoints[p.id],'skandha_explorer_getTransaction',[p.metadata.transaction.hash]);}
        catch(error){p.admissionReport={unavailable:error.message};}
      }
      p.comparison=compareMutation(p.oracle,p.observed);
    }
    result.verdict=result.paths.some(p=>p.comparison.verdict.startsWith('UNEXPECTED_'))?'UNEXPECTED':result.paths.every(p=>p.comparison.verdict.startsWith('EXPECTED_'))?'MATCH':'INCONCLUSIVE';
    result.reproduction={...cases[i].reproduction,decisions:result.paths.map(p=>({path:p.id,oracle:p.oracle,observed:p.observed,receipt:p.receipt,admissionReport:p.admissionReport,replay:p.replay})),
      unexpected:result.verdict==='UNEXPECTED',shrink:result.verdict==='UNEXPECTED'?{automatic:false,dimension:definition.suite==='verification-gas'?'verificationGasLimit':null,boundary:v.parameter.boundary,maxAttempts:8,note:'Use minimizeBoundary with an explicit bounded predicate; never probe automatically on the shared devnet'}:null};
  }
  output.campaign={generatorVersion:GENERATOR_VERSION,suite:definition.suite,seed:definition.seed,count:definition.count,selectedVariant:options.variant??null,definitionDigest:variants[0].definitionDigest,ruleModelVersion:definition.ruleModel.version??null};
  output.network=network;
  output.coverage=mutationCoverage(output.results);
  output.totals={cases:output.results.length,matched:output.results.filter(c=>c.verdict==='MATCH').length,unexpected:output.results.filter(c=>c.verdict==='UNEXPECTED').length,
    inconclusive:output.results.filter(c=>c.verdict==='INCONCLUSIVE').length,transportFailures:output.results.flatMap(c=>c.paths).filter(p=>p.comparison.verdict==='TRANSPORT_FAILURE').length,
    preconditionFailures:output.results.flatMap(c=>c.paths).filter(p=>p.comparison.verdict==='PRECONDITION_FAILURE').length};
  return redact(output);
}

export async function replayMutationDescriptor(descriptor,options={}) {
  const variant=regenerateMutation(descriptor);
  return runMutationCampaign({...options,configFile:options.configFile??descriptor.network?.configFile,definition:descriptor.definition,variant:variant.index});
}
