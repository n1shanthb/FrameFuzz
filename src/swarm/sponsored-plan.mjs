import {readFile} from 'node:fs/promises';
import {encodeDeployData,getContractAddress,keccak256} from 'viem';
import {compileOwnedFixtures} from './compile.mjs';
import {prepareLiveProof} from './readiness.mjs';
import {frameDigest} from '../mutations/frames.mjs';
export const SPONSORED_PROFILE='ethrex-9aa364-workshop-sponsored-v1';
const address=x=>typeof x==='string'&&/^0x[\da-f]{40}$/i.test(x)&&!/^0x0{40}$/i.test(x);
const load=async file=>JSON.parse(await readFile(new URL('../../'+file,import.meta.url),'utf8'));

/** Pure offline preparation. Addresses are predictions, never deployed-state claims. */
export async function prepareSponsoredPlan({investigation,variant=1,context={},...extra}={}){
  if(Object.keys(extra).length||!context||Array.isArray(context)||Object.keys(context).some(k=>!['chainId','profile','deployer','owner','deploymentNonce','payer'].includes(k)))throw new Error('Unsupported sponsored preparation input; no keys, RPC or write options accepted');
  if(context.chainId!==1337||context.profile!==SPONSORED_PROFILE)throw new Error('Explicit chain1337 and pinned sponsored profile required');
  for(const key of ['deployer','owner','payer'])if(context[key]!==undefined&&!address(context[key]))throw new Error('Invalid '+key);
  if(context.deploymentNonce!==undefined&&(!/^(0|[1-9]\d{0,15})$/.test(String(context.deploymentNonce))||BigInt(context.deploymentNonce)>BigInt(Number.MAX_SAFE_INTEGER)-5n))throw new Error('Invalid bounded deployment nonce');
  if((context.deployer!==undefined)!==(context.deploymentNonce!==undefined))throw new Error('Deployer and observed pending deployment nonce must be supplied together');
  const config=await load('examples/live/devnet.json');
  if(context.payer&&context.payer.toLowerCase()!==config.paymasters.basic.toLowerCase())throw new Error('Payer differs from pinned sponsored candidate');
  const evidence=await prepareLiveProof({investigation,variant,preflight:await load('evidence/swarm/phase-3/preflight.json'),secondHead:await load('evidence/swarm/phase-3/head-second.json')});
  const compiled=await compileOwnedFixtures(),resolved=Boolean(context.deployer&&context.owner&&context.payer),missing=['deployer','deploymentNonce','owner','payer'].filter(k=>context[k]===undefined);
  const first=context.deployer?BigInt(context.deploymentNonce):null;
  const action=first===null?null:getContractAddress({from:context.deployer,nonce:first});
  const deployments=evidence.plan.deployments.map((d,index)=>{
    const artifact=compiled.artifacts[d.contract],nonce=first===null?null:first+BigInt(index);
    const args=index===0?[]:resolved?[context.owner,action,context.payer]:null;
    const initCode=args?encodeDeployData({abi:artifact.abi,bytecode:artifact.bytecode,args}):null;
    return {role:d.role,contract:d.contract,nonce:nonce===null?null:String(nonce),predictedAddress:nonce===null?null:getContractAddress({from:context.deployer,nonce}),
      addressStatus:'PREDICTED_ONLY_NOT_DEPLOYED',constructorArguments:args,creationBytecodeHash:keccak256(artifact.bytecode),initCode,initCodeHash:initCode?keccak256(initCode):null,
      gasLimit:'6000000',maxFeePerGas:'2000000000',maximumFeeWei:'12000000000000000',valueWei:'0'};
  });
  const submissions=evidence.plan.submissions.map((s,i)=>({...s,sender:deployments[i+1].predictedAddress,payer:context.payer??null,action,nonceSeq:null,
    nonceDependency:'Observe sender account nonce after constructor/internal CREATEs; key0 is account nonce, never assume zero',freshSignatureRequired:true}));
  const result={schema:'framefuzz.sponsored-preparation.v1',path:'SPONSORED_THREE_FRAME',chainId:1337,profile:SPONSORED_PROFILE,context,
    descriptorDigest:evidence.model.descriptorDigest,mutationValues:evidence.model.mutationValues,compiler:evidence.compiler,
    preparationComplete:resolved,missingInputs:missing,liveReady:false,broadcastCapability:false,signaturesGenerated:0,
    deployments,submissions,feeBounds:{deploymentWei:'60000000000000000',frameWei:'4000000000000000',totalWei:'64000000000000000',
      sponsorFunding:'UNRESOLVED_SEPARATE_REQUIREMENT; no sponsor restoration or transfer planned'},
    prerequisites:['Reobserve deployer pending nonce, balance and empty CREATE addresses','Verify payer code hash, payment capability and sufficient balance','Verify runtime hash/helpers and gas with authorized baselines','Resolve each deployed sender account nonce and action pre-state','Obtain separate human authorization for exact addresses and total funding exposure'],
    historicalPreflightReference:'evidence/swarm/phase-3/preflight.json; not current deployment state',
    assumptions:['Sequential top-level CREATE transactions from one deployer; no interleaving transactions','Per-deployment gas cap is not an estimate','Self-funded candidate is separate and has no PAYMENT frame']};
  return {...result,manifestDigest:frameDigest(result)};
}
