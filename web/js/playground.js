import {esc} from './utils.js';
const s={mode:'byoc',source:'',abi:'',role:'UNKNOWN',contractName:'',contracts:[],config:null,analysis:null,job:null,report:null,timeline:[],phase:'IDLE',error:'',version:0,active:false,controller:null,filter:'all',replay:null,budget:null,arkivImport:null,arkivPublish:null};
const $=id=>document.getElementById(id);
async function request(route,body,signal){const res=await fetch('/api/playground/'+route,{...(body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{}),signal:signal??AbortSignal.timeout(20000)});const data=await res.json();if(!res.ok)throw Error(data.error??'Request failed');return data;}
const isBusy=()=>['ANALYZING','INVESTIGATING','CANCELLING'].includes(s.phase);
const filters=[['all','All proposals'],['executed','Executed'],['negative','Expected rejections'],['unexpected','Unexpected results'],['invalid','Invalid / filtered'],['missing','Missing prerequisites']];
function agentCards(){
 const roles=[['scout','Contract Scout'],['mutation','Semantic Mutation'],['validator','Feasibility Validator'],['critic','Evidence Critic']];
 return `<div class="byoc-agents">${roles.map(([role,name])=>{
  const a=s.report?.agents[role],events=s.timeline.filter(e=>e.role===role),last=events.at(-1),requests=events.filter(e=>e.stage==='AGENT_REQUEST').length;
  return `<section class="milestone"><h4>${name}</h4><p class="mono tiny">${esc(a?.id??(s.job?s.job+':'+role:'Independent session not started'))}</p><span class="tag info">${esc(a?.state??(last?.stage==='AGENT_REQUEST'?'REQUESTING_MODEL':last?'WAITING':'NOT STARTED'))}</span><p>${a?.calls??requests} actual requests${a?` · $${Number(a.costUSD).toFixed(6)} · ${a.tokens} accounted tokens`:''}</p><p>${esc(a?.objective??'Own instructions, history, observations and tool permissions are created when the investigation starts.')}</p>${a?`<details><summary>Private session state & history</summary><pre class="details">${esc(JSON.stringify(a,null,2))}</pre></details>`:last?.response?`<p>${esc(last.response.summary)}</p>`:''}</section>`;
 }).join('')}</div>`;
}
function arkivIntelHtml(){
 const d=s.report?.arkivIntelligence?.discovery??s.analysis?.arkivDiscovery;
 const usage=s.report?.arkivIntelligence;
 if(!d&&!s.analysis)return '';
 const status=d?.status??'PENDING';
 const statusClass=status==='AVAILABLE'?'ok':status==='UNAVAILABLE'?'bad':status==='EMPTY'||status==='NO_APPLICABLE_QUERY'?'idle':'info';
 const cases=d?.cases??[];
 return `<section class="arkiv-intel" id="arkivIntel">
  <h3>Community Regression Intelligence</h3>
  <p>Arkiv improves this investigation by surfacing verified historical admission boundaries agents can cite — without treating them as fresh proof.</p>
  <p><span class="tag ${statusClass}">${esc(status)}</span> · ${cases.length} relevant case(s) · source ${esc(d?.source??'n/a')} · broadcasts 0</p>
  <p class="muted">${esc(d?.notice??'Analyze a contract to query Arkiv automatically.')}</p>
  ${cases.map(c=>`<article class="arkiv-case">
    <h4>${esc(c.suite)} / ${esc(c.ruleId)} · score ${c.relevance?.score??'?'}</h4>
    <p class="mono tiny">${esc(c.entityKey)}</p>
    <p>Publisher ${esc(c.publisher)} · digest ${esc(String(c.contentDigest).slice(0,16))}… · expires ${esc(c.expiresAtBlock)} · ${c.replayAllowed?'replayable unsigned preview':'not currently replayable'}</p>
    <p><strong>Why relevant:</strong> ${esc((c.relevance?.reasons||[]).join(' · ')||'n/a')}</p>
    <p><strong>Integrity:</strong> schema ${esc(c.verification?.schema)} · digest ${esc(c.verification?.digest)} · creator ${esc(c.verification?.creatorBinding)} · ${esc(c.verification?.expiry)}</p>
    <p class="muted">Historical outcomes are publisher claims, not current admission proof.</p>
    <button class="btn btn-secondary" data-arkiv-import="${esc(c.entityKey)}" type="button">Import → unsigned replay</button>
    ${c.replayAllowed?'':'<p class="muted tiny">Saved snapshot may still import if the live entity is unexpired; import re-verifies on chain.</p>'}
  </article>`).join('')||(status==='AVAILABLE'?'':'')}
  ${usage?`<div class="arkiv-usage"><strong>Agent usage:</strong> consulted ${usage.consulted?.length??0} · influences ${usage.influences?.length??0}
    ${(usage.influences||[]).slice(-4).map(i=>`<div>${esc(i.role)} · ${esc(i.action)}${i.changedDecision?' · changed decision':''}${i.detail?` — ${esc(i.detail)}`:''}</div>`).join('')||'<div>No agent influence recorded yet.</div>'}
  </div>`:''}
  ${s.arkivImport?`<details open><summary>Import result (historical vs fresh preview)</summary><pre class="details">${esc(JSON.stringify(s.arkivImport,null,2))}</pre></details>`:''}
  ${s.config?.arkivOperatorConfigured?`<div style="margin-top:12px"><button class="btn btn-secondary" id="arkivPublishBtn" type="button">Save Regression to Arkiv…</button>
    ${s.arkivPublish?`<pre class="details">${esc(JSON.stringify(s.arkivPublish,null,2))}</pre>${s.arkivPublish.canPublish&&s.arkivPublish.confirmToken?`<button class="btn btn-primary" id="arkivPublishConfirm" type="button">Confirm one publication</button>`:''}`:''}</div>`
    :`<p class="muted" style="margin-top:10px">Judges may query, verify and import. Wallet-backed publish requires an authenticated operator.</p>`}
 </section>`;
}
function analysisHtml(){const a=s.analysis;if(!a)return '<p class="muted">Choose a mode, then analyze. BYOC uses pasted source. Uniswap loads pinned paymaster + historical admission evidence. Registry discovers Arkiv regressions without automatic writes.</p>';
 return `<p><strong>${esc(a.status)}</strong> · profile ${esc(a.profile?.id??'byoc')} · ${esc(a.compiler??'profile/source')} · digest ${esc(a.sourceDigest)}</p>${a.analysisId?`<p class="mono tiny">Analysis identity: ${esc(a.analysisId)}</p>`:''}
 <p>Role: ${esc(a.detectedRole?.role??'UNKNOWN')} (${esc(a.detectedRole?.basis??'No role evidence')}).</p>
 <p>Available: ${esc(a.capabilities?.join(', ')||'None')}. Missing: ${esc(a.missingPrerequisites?.join('; ')||'None listed')}.</p>
 ${a.profile?.historicalEvidence?`<p class="alert">Historical live capture ${esc(a.profile.historicalEvidence.capturedAt)} · report digest ${esc(a.profile.historicalEvidence.reportDigest)} · staked alt inclusion hash ${esc(a.profile.historicalEvidence.stakedCase?.alt?.inclusionHash||'n/a')}. This is not a fresh EIP-8141 run.</p>`:''}
 ${a.profile?.uniswapContext?`<p>StateView: ${esc(a.profile.uniswapContext.stateView)} · pool ${esc(a.profile.uniswapContext.poolId)} · interaction ${esc(a.profile.uniswapContext.interaction)}. No swap / USDC reimbursement claim.</p>`:''}
 ${a.functions?`<p>${a.functions.length} ABI functions · ${(a.structure?.variables||[]).length} state vars · ${(a.structure?.events||[]).length} events · ${(a.structure?.externalCalls||[]).length} external call sites.</p><details><summary>Verified facts</summary><pre class="details">${esc(JSON.stringify({functions:a.functions,facts:a.sourceFacts,profile:a.profile},null,2))}</pre></details>`:''}
 ${a.diagnostics?.length?`<details ${a.status!=='READY'?'open':''}><summary>Diagnostics / profile notices</summary><pre class="details">${esc(JSON.stringify(a.diagnostics,null,2))}</pre></details>`:''}
 ${arkivIntelHtml()}`;
}
function resultsHtml(){const r=s.report;if(!r)return `<p class="muted">${s.phase==='INVESTIGATING'?'Only actual agent requests and completed tool events appear below.':'No investigation result yet.'}</p>`;
 const entries=r.workspace.proposals.filter(e=>s.filter==='all'||s.filter==='executed'&&e.state==='EXECUTED'||s.filter==='negative'&&e.proposal.expectedVerdict==='REJECT'||s.filter==='unexpected'&&e.outcome?.findingCandidate||s.filter==='invalid'&&['INVALID','DUPLICATE','UNSUPPORTED'].includes(e.feasibility?.effective)||s.filter==='missing'&&e.feasibility?.effective==='CONDITIONAL');
 return `<div class="alert"><strong>${esc(r.source)} · ${esc(r.profileId||'byoc')} · ${esc(r.status)}</strong><p>${r.realModelCalls} genuine model calls · ${r.provider.calls} transport requests · $${Number(r.provider.transport==='OPENROUTER'?r.provider.costUSD:0).toFixed(8)} paid/accounted. EVM executed: ${r.evmExecuted}. Admission verified: ${r.admissionVerified}. Verified vulnerability: ${r.verifiedVulnerability}.</p>${r.error?`<p>${esc(r.error)}</p>`:''}</div>
 <div class="row"><a class="btn btn-secondary" download href="/api/playground/export?id=${encodeURIComponent(s.job)}&format=json">Export JSON</a><a class="btn btn-secondary" download href="/api/playground/export?id=${encodeURIComponent(s.job)}&format=markdown">Export Markdown</a><label>Filter <select id="byocFilter">${filters.map(([id,label])=>`<option value="${id}" ${s.filter===id?'selected':''}>${label}</option>`).join('')}</select></label></div>
 ${entries.map(e=>`<section class="card" style="margin-top:12px"><h3>${esc(e.proposal.id)} · rev ${e.revision} · ${esc(e.state)}</h3><p>${esc(e.proposal.hypothesis)}</p><p class="mono">${esc(e.proposal.functionSignature)} · ${esc(e.proposal.domain)} · ${esc(e.proposal.tool)}</p><p>Original ${esc(JSON.stringify(e.proposal.originalArgs))} → mutated ${esc(JSON.stringify(e.proposal.mutatedArgs))}</p><p><strong>Validator:</strong> ${esc(e.feasibility?.model.decision??'PENDING')} · ${esc(e.feasibility?.model.reason??'')}</p><p><strong>Deterministic:</strong> ${esc(e.feasibility?.effective??'PENDING')} · ${esc(e.feasibility?.deterministic.reason??'')}</p><p class="tag ${e.outcome?.findingCandidate?'warn':'info'}">${esc(e.outcome?.classification??'NOT EXECUTED')} · domain ${esc(e.outcome?.outcomeDomain??e.proposal.domain)}</p><p>Expected ${esc(e.outcome?.expectedVerdict??e.proposal.expectedVerdict)} / observed ${esc(e.outcome?.observedVerdict??'NONE')}. Provenance: ${esc(e.outcome?.provenance??'n/a')}.</p><details><summary>Tool output & descriptor</summary><pre class="details">${esc(JSON.stringify({proposal:e.proposal,feasibility:e.feasibility,execution:e.execution,reproduction:e.reproduction},null,2))}</pre></details>${e.state==='EXECUTED'?`<button class="btn btn-secondary" data-byoc-replay="${esc(e.entryId)}">Replay local tool</button>`:''}</section>`).join('')||'<p>No proposals match this filter.</p>'}
 ${r.critic?`<h3>Evidence Critic</h3><p>${esc(r.critic.assessment)}</p><p>Unresolved: ${esc(r.critic.unresolved.join('; '))}</p>`:''}
 <details><summary>Agent-to-agent messages</summary><pre class="details">${esc(JSON.stringify(r.workspace.messages,null,2))}</pre></details>`;
}
function paint(){if(!s.active||!$('byocPanels'))return;
 const needsSource=s.mode==='byoc';
 $('byocStatus').textContent=s.error||`${s.phase} · mode ${s.mode} · no automatic chain/Arkiv writes`;
 $('byocAnalyze').disabled=isBusy()||(needsSource&&!s.source.trim());$('byocStart').disabled=isBusy()||s.analysis?.status!=='READY'||!s.config?.canStart;$('byocCancel').disabled=!isBusy();
 if($('byocSourceWrap'))$('byocSourceWrap').hidden=s.mode!=='byoc';
 if($('byocBudget'))$('byocBudget').textContent=s.budget?`Sprint budget remaining $${Number(s.budget.remainingUSD).toFixed(4)} / $${Number(s.budget.capUSD).toFixed(2)} (spent $${Number(s.budget.spentUSD).toFixed(4)})`:'Budget unknown';
 $('byocAnalysis').innerHTML=analysisHtml();$('byocPanels').innerHTML=`<h2>Live agent sessions</h2>${agentCards()}<h2 style="margin-top:24px">Mutation workbench & experiment results</h2>${resultsHtml()}${s.replay?`<pre class="details">${esc(JSON.stringify(s.replay,null,2))}</pre>`:''}${s.timeline.length?`<details><summary>Trace (${s.timeline.length} events)</summary><pre class="details">${esc(JSON.stringify(s.timeline,null,2))}</pre></details>`:''}`;
 $('byocFilter')?.addEventListener('change',e=>{s.filter=e.target.value;paint();});
 document.querySelectorAll('[data-byoc-replay]').forEach(el=>el.addEventListener('click',async()=>{const version=s.version;el.disabled=true;try{const result=await request('replay',{id:s.job,entryId:el.dataset.byocReplay});if(version===s.version)s.replay=result;}catch(e){s.error=e.message;}if(version===s.version)paint();}));
 document.querySelectorAll('[data-arkiv-import]').forEach(el=>el.addEventListener('click',async()=>{const version=s.version;el.disabled=true;try{const result=await request('arkiv/import',{entityKey:el.dataset.arkivImport,analysisId:s.analysis?.analysisId});if(version===s.version){s.arkivImport=result;s.error='';}}catch(e){if(version===s.version)s.error=e.message;}if(version===s.version)paint();}));
 $('arkivPublishBtn')?.addEventListener('click',async()=>{
  const version=s.version;const d=s.report?.arkivIntelligence?.discovery??s.analysis?.arkivDiscovery;const c=d?.cases?.[0];
  if(!c){s.error='No verified regression selected to publish.';paint();return;}
  try{
   const preview=await request('arkiv/publish-preview',{contentDigest:c.contentDigest,sourceReport:'playground-operator-preview',suite:c.suite,ruleId:c.ruleId,expiresAtBlock:c.expiresAtBlock,maxFeeEther:'0.001',live:{gasPriceWei:'1000000000',nonce:0,balanceWei:'10000000000000000000',currentBlock:'1'}});
   if(version===s.version){s.arkivPublish=preview;s.error='';}
  }catch(e){if(version===s.version)s.error=e.message;}
  if(version===s.version)paint();
 });
 $('arkivPublishConfirm')?.addEventListener('click',async()=>{
  const version=s.version;if(!s.arkivPublish?.confirmToken)return;
  try{const result=await request('arkiv/publish-confirm',{intentDigest:s.arkivPublish.confirmToken,confirm:true,maxFeeEther:s.arkivPublish.envelope?.maxFeeEther});if(version===s.version){s.arkivPublish={...s.arkivPublish,confirmResult:result};}}catch(e){if(version===s.version)s.error=e.message;}
  if(version===s.version)paint();
 });
}
async function cancel(){s.controller?.abort();if(s.job&&s.phase==='INVESTIGATING'){s.phase='CANCELLING';try{await request('cancel',{id:s.job});}catch(e){s.error=e.message;}}else if(s.phase==='ANALYZING')s.phase='CANCELLED';paint();}
function invalidate(){const oldJob=s.job;if(oldJob&&['INVESTIGATING','CANCELLING'].includes(s.phase))request('cancel',{id:oldJob}).catch(()=>{});s.controller?.abort();s.version++;s.analysis=null;s.report=null;s.job=null;s.timeline=[];s.replay=null;s.arkivImport=null;s.arkivPublish=null;s.phase='IDLE';s.error='Context changed: previous conclusions invalidated.';if($('byocConsent'))$('byocConsent').checked=false;paint();}
async function analyze(){const version=++s.version;s.phase='ANALYZING';s.error='';s.controller=new AbortController();paint();try{
 const input=s.mode==='byoc'?{source:s.source,role:s.role,profile:'byoc',...(s.contractName?{contractName:s.contractName}:{}),...(s.abi.trim()?{abi:JSON.parse(s.abi)}:{})}:{profile:s.mode};
 const a=await request('analyze',input,AbortSignal.any([s.controller.signal,AbortSignal.timeout(20000)]));if(version!==s.version)return;
 s.analysis=a;s.contracts=a.contracts??[];s.phase=a.status;s.contractName=a.contractName??s.contractName;if(a.source&&s.mode!=='byoc')s.source=a.source;
 const select=$('byocContract');if(select){select.innerHTML='<option value="">Auto-select single contract</option>'+(s.contracts||[]).map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');select.value=s.contractName||'';}
 }catch(e){if(version===s.version){s.error=e.name==='AbortError'?'Analysis cancelled':e.message;s.phase='INCOMPLETE';}}if(version===s.version)paint();}
async function start(){if(!$('byocConsent')?.checked){s.error='Explicit consent is required before any model requests.';paint();return;}const version=s.version;s.phase='INVESTIGATING';s.error='';s.report=null;s.timeline=[];paint();
 try{const job=await request('start',{analysisId:s.analysis.analysisId,sourceDigest:s.analysis.sourceDigest,authorizeProvider:true,budgetUSD:s.mode==='uniswap-v4-paymaster'?0.35:0.55});if(version!==s.version){request('cancel',{id:job.id}).catch(()=>{});return;}s.job=job.id;
  while(version===s.version){const current=await request('job?id='+encodeURIComponent(s.job));if(version!==s.version)return;s.timeline=current.timeline??[];s.report=current.report;s.phase=current.state==='RUNNING'?s.phase:current.state;if(current.error)s.error=current.error;paint();if(current.state!=='RUNNING')break;await new Promise(r=>setTimeout(r,500));}
  try{s.budget=await request('budget');}catch{}paint();
 }catch(e){if(version===s.version){s.error=e.message;s.phase='INCOMPLETE';paint();}}
}
export function renderPlayground(){return `<section class="card"><div class="eyebrow">Investigation playground</div><h1>Contract · Uniswap · Registry</h1><p class="summary">Analyze a contract and FrameFuzz automatically queries Arkiv for relevant community regressions. Agents cite verified cases; import stays unsigned; publish is operator-confirm only.</p>
 <div class="row" id="byocModes">${[['byoc','Bring Your Own Contract'],['uniswap-v4-paymaster','Uniswap Paymaster Admission'],['regression-registry','Regression Registry']].map(([id,label])=>`<button class="btn ${s.mode===id?'btn-primary':'btn-secondary'}" data-mode="${id}" type="button">${label}</button>`).join('')}</div>
 <p class="alert" id="byocModeHelp"></p><p class="muted" id="byocBudget">Budget…</p>
 <div id="byocSourceWrap"><label class="field">Solidity source<textarea id="byocSource" class="byoc-editor" spellcheck="false" placeholder="Paste a self-contained Solidity contract…">${esc(s.source)}</textarea></label><p class="muted">solc 0.8.28 · ≤64 KiB · imports disabled · no shell/file/URL resolution.</p>
 <div class="grid-2"><label class="field">Optional ABI JSON<textarea id="byocAbi" class="byoc-abi" spellcheck="false">${esc(s.abi)}</textarea></label><div><label class="field">Contract name<select id="byocContract"><option value="">Auto-select</option></select></label><label class="field">Declared role<select id="byocRole">${['UNKNOWN','EXECUTION_TARGET','SENDER_VALIDATOR','PAYMASTER'].map(r=>`<option ${s.role===r?'selected':''}>${r}</option>`).join('')}</select></label></div></div></div>
 <div class="row"><button class="btn btn-primary" id="byocAnalyze">Detect / Analyze</button><button class="btn btn-secondary" id="byocCancel">Cancel</button></div><p id="byocStatus" role="status" aria-live="polite"></p><div id="byocAnalysis"></div>
 <hr><label class="row"><input type="checkbox" id="byocConsent"> Consent placeholder</label><p class="muted" id="byocConfig">Reading configuration…</p><button class="btn btn-primary" id="byocStart">Start Investigation</button></section><section class="card" id="byocPanels"></section>`;}
function modeHelp(){return s.mode==='byoc'?'BYOC: compiler/ABI/AST tools for pasted source. Arkiv is queried only when EIP-8141/paymaster signals exist — generic ERC-20s will not inherit unrelated gas fixtures.':s.mode==='uniswap-v4-paymaster'?'Uniswap: StateView + historical public/alt evidence + automatic Arkiv discovery for storage/stake regressions. Predictions are not fresh admissions.':'Registry: discover both published suites, one-click unsigned import, operator one-click publish confirmation under the fee ceiling.';}
export function bindPlayground(){s.active=true;document.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>{if(s.mode===btn.dataset.mode)return;s.mode=btn.dataset.mode;invalidate();document.querySelectorAll('[data-mode]').forEach(b=>b.className=`btn ${b.dataset.mode===s.mode?'btn-primary':'btn-secondary'}`);$('byocModeHelp').textContent=modeHelp();paint();}));
 $('byocModeHelp').textContent=modeHelp();
 $('byocSource')?.addEventListener('input',e=>{s.source=e.target.value;s.contractName='';s.contracts=[];invalidate();});
 $('byocAbi')?.addEventListener('input',e=>{s.abi=e.target.value;invalidate();});
 $('byocRole')?.addEventListener('change',e=>{s.role=e.target.value;invalidate();});
 $('byocContract')?.addEventListener('change',e=>{s.contractName=e.target.value;invalidate();});
 $('byocAnalyze').addEventListener('click',analyze);$('byocStart').addEventListener('click',start);$('byocCancel').addEventListener('click',cancel);paint();
 request('config').then(c=>{s.config=c;s.budget=c.sprintBudget;if(s.active){
  const r=c.investigationReadiness;
  $('byocConfig').textContent=c.canStart
    ?`${c.transport} · ${c.model} · READY · mode ${r?.mode??c.capabilityMode??'n/a'} · OpenRouter key ${r?.openRouterKeyPresent?'loaded':'missing'} · budget $${Number(c.sprintBudget?.remainingUSD??0).toFixed(4)} remaining`
    :`${c.transport} · ${c.model} · investigations disabled — ${r?.notice||'see investigationReadiness'}`;
  const checkbox=$('byocConsent');checkbox.parentElement.lastChild.textContent=c.transport.startsWith('MOCK')?' I authorize this mocked test-transport investigation; no paid model.':` I consent to OpenRouter Sonnet under the remaining sprint budget (cap $${c.sprintBudget?.capUSD??1}); no blockchain/Arkiv writes until I start.`;
  paint();
 }}).catch(e=>{s.error=e.message;paint();});
}
export function leavePlayground(){if(isBusy())cancel();s.active=false;}
