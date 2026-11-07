import { createHash } from 'node:crypto';
import { expectation } from './oracle.mjs';

export const GENERATOR_VERSION='framefuzz.semantic.v1';
export const MUTATION_SUITES=['verification-gas','uniswap-storage'];
export const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

function random(seed) {
  let state=seed>>>0;
  return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
}
function shuffle(values,next) {
  const result=[...values];
  for(let i=result.length-1;i>0;i--){const j=Math.floor(next()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
export function mutationDefinition({suite='verification-gas',seed=42,count=suite==='uniswap-storage'?3:7,rules}={}) {
  return {version:GENERATOR_VERSION,suite,seed,count,ruleModel:structuredClone(rules ?? {}),
    baseTemplate:{id:'workshop-sponsored-v1',model:{verificationGasLimit:50000,poolRead:false},setup:{staked:false,poolRead:false,configuration:{kind:'basic'}}},
    operation:suite==='verification-gas'?{type:'set-field',field:'verificationGasLimit',distances:[1,2,10],radius:Math.max(32,Math.ceil(count/2))}:{type:'storage-and-stake'},
    paths:['public','alt']};
}

export function generateMutations(definition) {
  function rejectSecrets(value){if(value&&typeof value==='object')for(const [key,item]of Object.entries(value)){if(/private.?key|mnemonic|secret|password|token|authorization/i.test(key))throw new Error('Credentials cannot enter mutation definitions');rejectSecrets(item);}}
  rejectSecrets(definition);
  const d=structuredClone(definition);
  if(d.version!==GENERATOR_VERSION || !MUTATION_SUITES.includes(d.suite))throw new Error('Unsupported mutation definition version or suite');
  if(!Number.isSafeInteger(d.seed)||d.seed<0||d.seed>0xffffffff)throw new Error('seed must be a uint32 integer');
  if(!Number.isSafeInteger(d.count)||d.count<1||d.count>1000)throw new Error('count must be between 1 and 1000');
  if(!Array.isArray(d.paths)||!d.paths.length||d.paths.some(p=>!['public','alt'].includes(p))||new Set(d.paths).size!==d.paths.length)throw new Error('Unsupported or duplicate admission paths');
  if(!d.baseTemplate?.id||!d.baseTemplate.model||!d.baseTemplate.setup)throw new Error('Base model and setup required');
  if(Object.keys(d.baseTemplate.model).some(k=>!['verificationGasLimit','poolRead'].includes(k)))throw new Error('Unsupported unsigned model dimension');
  if(!Number.isSafeInteger(d.baseTemplate.model.verificationGasLimit)||d.baseTemplate.model.verificationGasLimit<0||typeof d.baseTemplate.model.poolRead!=='boolean')throw new Error('Invalid unsigned model gas or pool-read flag');
  if(typeof d.baseTemplate.setup.staked!=='boolean'||typeof d.baseTemplate.setup.poolRead!=='boolean'||!['basic','unstaked','staked'].includes(d.baseTemplate.setup.configuration?.kind))throw new Error('Unsupported sponsor setup requirements');
  const next=random(d.seed), base=d.baseTemplate;
  let changes;
  if(d.suite==='verification-gas') {
    if(d.operation?.type!=='set-field'||d.operation.field!=='verificationGasLimit')throw new Error('Unsupported gas mutation dimension');
    const g=d.ruleModel.gas;
    const boundary=g?g.maxTotal-g.senderExecution-g.signatureCost:d.operation.boundary;
    if(!Number.isSafeInteger(boundary)||boundary<1)throw new Error('A numeric boundary is required even when rule provenance is unknown');
    const radius=d.operation.radius;
    if(!Number.isSafeInteger(radius)||radius<1||radius>10000||d.count>2*radius+1||boundary-radius<0||!Number.isSafeInteger(boundary+radius))throw new Error('Invalid sampling radius/count or gas range');
    if(!Array.isArray(d.operation.distances)||d.operation.distances.some(x=>!Number.isSafeInteger(x)||x<1||x>radius))throw new Error('Invalid boundary distances');
    const offsets=[0];
    for(const distance of d.operation.distances)for(const sign of [-1,1])if(!offsets.includes(sign*distance))offsets.push(sign*distance);
    // Anchor boundary and adjacent values; sample further unique offsets with the seeded PRNG.
    const selected=offsets.slice(0,d.count), remaining=shuffle(Array.from({length:2*radius+1},(_,i)=>i-radius).filter(x=>!selected.includes(x)),next);
    while(selected.length<d.count)selected.push(remaining.pop());
    changes=shuffle(selected,next).map(offset=>({model:{...base.model,verificationGasLimit:boundary+offset},setup:structuredClone(base.setup),
      parameter:{field:d.operation.field,value:boundary+offset,offset,boundary,region:offset<0?'below':offset>0?'above':'at'}}));
  } else {
    if(d.operation?.type!=='storage-and-stake'||d.count>3)throw new Error('Storage family supports exactly three distinct setup states at most');
    changes=shuffle([{kind:'basic',poolRead:false,staked:false},{kind:'unstaked',poolRead:true,staked:false},{kind:'staked',poolRead:true,staked:true}],next).slice(0,d.count)
      .map(state=>({model:{...base.model,poolRead:state.poolRead},setup:{...base.setup,poolRead:state.poolRead,staked:state.staked,configuration:{kind:state.kind}},
        parameter:{operation:'storage-and-stake',...state,region:state.kind}}));
  }
  const definitionDigest=digest(d);
  return changes.map((change,index)=>{
    const oracle=Object.fromEntries(d.paths.map(path=>{const o=expectation(change.model,change.setup,path,d.ruleModel);if(d.suite==='uniswap-storage'&&o.expected!=='rejected')o.ruleId='STORAGE_ACCESS';return [path,o];}));
    const id=`${d.suite}-s${d.seed}-${index}-${d.suite==='verification-gas'?change.parameter.value:change.parameter.kind}`;
    return {id,index,suite:d.suite,seed:d.seed,baseTemplateId:base.id,definitionDigest,unsignedModel:change.model,setup:change.setup,parameter:change.parameter,oracle,
      descriptor:{schema:'framefuzz.mutation-reproduction.v1',generatorVersion:GENERATOR_VERSION,definition:d,definitionDigest,variantIndex:index,
        baseTemplateId:base.id,unsignedModel:change.model,setup:change.setup,oracle,
        accountAllocation:'Allocate a fresh isolated sender per case/path, query pending nonce after checked setup, re-encode and re-sign; never replay stale signed bytes',
        cli:`node bin/framefuzz.mjs mutate --suite ${d.suite} --seed ${d.seed} --count ${d.count} --variant ${index} --submit --allow-chain 1337`}};
  });
}

export function regenerateMutation(descriptor) {
  if(descriptor.schema!=='framefuzz.mutation-reproduction.v1'||digest(descriptor.definition)!==descriptor.definitionDigest)throw new Error('Invalid or altered reproduction descriptor');
  const generated=generateMutations(descriptor.definition)[descriptor.variantIndex];
  if(!generated||digest(generated.unsignedModel)!==digest(descriptor.unsignedModel)||digest(generated.setup)!==digest(descriptor.setup))throw new Error('Descriptor does not match deterministic semantic sequence');
  return generated;
}

/** Bounded, explicitly monotonic single-dimension minimization. The caller owns
 * the predicate: no network probing is started automatically by this utility. */
export async function minimizeBoundary({value,boundary,reproduces,maxAttempts=8}) {
  if(!Number.isSafeInteger(value)||!Number.isSafeInteger(boundary)||typeof reproduces!=='function'||!Number.isSafeInteger(maxAttempts)||maxAttempts<1||maxAttempts>16)throw new Error('Invalid bounded minimization request');
  let attempts=0,best=value;
  if(!(await reproduces(value)))return {value,attempts:1,reproduced:false,minimal:false};
  attempts++;
  const direction=Math.sign(value-boundary);
  let low=0,high=Math.abs(value-boundary);
  while(low<high&&attempts<maxAttempts){const mid=Math.floor((low+high)/2),candidate=boundary+direction*mid;attempts++;
    if(await reproduces(candidate)){high=mid;best=candidate;}else low=mid+1;}
  return {value:best,attempts,reproduced:true,minimal:low===high,assumption:'Predicate is monotonic between original value and the rule boundary'};
}
