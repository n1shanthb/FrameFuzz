import {validateHypothesis,hypothesisKey} from './hypothesis.mjs';
export function selectHypothesis(proposals,{executed=[],known=['2:999']}={}){
 const seen=new Set(),ran=new Set(executed.map(hypothesisKey)),categories=new Set(executed.map(h=>h.change)),rejected=[],candidates=[];
 for(const p of proposals){let h;try{h=validateHypothesis(p.hypothesis);}catch(e){rejected.push({perspective:p.perspective,reason:e.message});continue;}
  const key=hypothesisKey(h);if(h.suite!=='frame-authorization'){rejected.push({perspective:p.perspective,key,reason:'Previously covered v1 gas/storage suite; unavailable for this offline backend'});continue;}
  if(seen.has(key)||ran.has(key)){rejected.push({perspective:p.perspective,key,reason:'Duplicate or already executed semantic mutation'});continue;}seen.add(key);
  const score=(categories.has(h.change)?10:100)-(known.includes(key)?200:0);
  candidates.push({...p,hypothesis:h,key,score,coverageReason:known.includes(key)?'Existing offline demonstration; deprioritized':categories.has(h.change)?'New values, existing field family':'New field-family coverage'});
 }
 candidates.sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key));return {selected:candidates[0]??null,candidates,rejected};
}
