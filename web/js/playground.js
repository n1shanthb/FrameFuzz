import {esc} from './utils.js';
const s={mode:'byoc',source:'',abi:'',role:'UNKNOWN',contractName:'',contracts:[],config:null,analysis:null,admission:null,job:null,report:null,timeline:[],phase:'IDLE',error:'',version:0,active:false,controller:null,filter:'all',replay:null,budget:null,arkivImport:null,arkivPublish:null,liveWallet:'',liveForeign:'',liveOwner:'',livePrepared:null,liveComparison:null,liveJobId:null,savedRegression:null,scenarioKind:null};
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
function liveTableHtml(){
 const rows=s.liveComparison?.table??[];
 const claims=s.liveComparison?.claims;
 if(!rows.length)return '<p class="muted">No live admission rows yet. Table fills only from fresh RPC responses after Run Live Comparison — never from prior evidence.</p>';
 return `<div class="alert"><strong>Claims</strong> · ADMISSION_DIVERGENCE=${esc(String(claims?.ADMISSION_DIVERGENCE??rows[0]?.claims?.ADMISSION_DIVERGENCE??false))} · INCLUSION=${esc(String(claims?.INCLUSION??false))} · EXECUTION_SUCCESS=${esc(String(claims?.EXECUTION_SUCCESS??'NOT_OBSERVED'))}</div>
 <div class="table-wrap"><table class="data"><thead><tr>
  <th>Mutation</th><th>Public</th><th>Alternative</th><th>Policy divergence</th><th>Inclusion</th><th>Tx / binding / RPC</th>
 </tr></thead><tbody>
 ${rows.map(row=>`<tr>
  <td>${esc(row.mutation)}<div class="tiny">${esc(row.evidence?.timestamp??'')}</div></td>
  <td class="${/REJECTED_POLICY/.test(row.publicVerdict||row.canonicalVerdict)?'cell-bad':/ACCEPTED/.test(row.publicVerdict||row.canonicalVerdict)?'cell-ok':''}">${esc(row.publicVerdict||row.canonicalVerdict)}<div class="tiny">${esc(row.publicReason||row.evidence?.rule||'')}</div></td>
  <td class="${/ACCEPTED/.test(row.alternativeVerdict)?'cell-ok':/REJECTED/.test(row.alternativeVerdict)?'cell-bad':''}">${esc(row.alternativeVerdict)}<div class="tiny">admission ${esc(row.admissionId??row.evidence?.sidecarAdmissionId??'n/a')}</div></td>
  <td>${esc(row.divergence)}${row.policyDivergence?' · TRUE':''}</td>
  <td>${esc(row.inclusionStatus??(row.inclusion?'MINED':'NOT_MINED'))}<div class="tiny">${esc(row.evidence?.laterMempoolOutcome??'')}</div></td>
  <td class="mono tiny">hash ${esc(row.evidence?.transactionHash||row.evidence?.hash||'')}<br>digest ${esc(row.evidence?.sourceDigest||'')}<br>wallet ${esc(row.evidence?.wallet||'')}<br>provenance ${esc(row.evidence?.provenance||'')}</td>
 </tr>`).join('')}
 </tbody></table></div>
 <details open><summary>Actual RPC response evidence</summary><pre class="details">${esc(JSON.stringify(rows[0]?.evidence?.rpc??{canonical:s.liveComparison?.canonical,alternative:s.liveComparison?.alternative},null,2))}</pre></details>`;
}
function admissionHtml(){const r=s.admission;if(s.mode!=='byoc')return '';
 const liveCapable=s.analysis?.capabilities?.includes('LIVE_STORAGE_ACCESS_ADMISSION');
 if(!r&&!liveCapable)return '<section class="card"><h3>PUBLIC vs ALTERNATIVE ADMISSION</h3><p>Load the supported storage-access scenario, Analyze, then prepare a fresh admission test.</p></section>';
 const live=r?.liveAdmission;
 const scen=s.config?.supportedScenario;
 return `<section class="card"><h3>PUBLIC vs ALTERNATIVE ADMISSION</h3>
 <p><strong>Primary product result</strong> · provenance LIVE only · ABI cards are secondary.</p>
 <p>Workflow: Paste/Load → Analyze → Prepare Admission Test → Run Live Comparison → Results → Save Regression.</p>
 <p>Detected frame role: ${esc(s.analysis?.detectedRole?.role??'NONE')} · chain 1337 · readiness ${esc(live?.classification??r?.classification??'n/a')} · server ${esc(s.config?.liveAuthorized?'LIVE_AUTHORIZED':'not live-authorized')}</p>
 ${liveCapable?`<p class="alert">${esc(scen?.kind||'SUPPORTED_SCENARIO_NOT_ARBITRARY_BYOC')}: ${esc(scen?.label||'workshop ViolatingWallet')}. Template runtime ${esc(s.analysis.runtimeBytecodeHash||'n/a')}. Binding uses immutable-slot mask against deployed code. Arbitrary Solidity is not live-tested.</p>
 <div class="grid-2">
  <label class="field">Deployed wallet<input id="liveWallet" value="${esc(s.liveWallet)}" placeholder="0x… ViolatingWallet"></label>
  <label class="field">Foreign target<input id="liveForeign" value="${esc(s.liveForeign)}" placeholder="0x… Foreign"></label>
  <label class="field">Owner address<input id="liveOwner" value="${esc(s.liveOwner)}" placeholder="0x… owner / signer"></label>
 </div>
 <div class="row" style="margin-top:10px">
  <button class="btn btn-secondary" id="liveBindScenario" type="button">Bind supported fixtures</button>
  <button class="btn btn-secondary" id="liveRefresh" type="button">Refresh live readiness</button>
  <button class="btn btn-secondary" id="livePrepare" type="button">Prepare Admission Test</button>
  <button class="btn btn-primary" id="liveRun" type="button" ${s.livePrepared&&s.config?.liveAuthorized?'':'disabled'}>Run Live Comparison</button>
  <button class="btn btn-secondary" id="liveSaveRegression" type="button" ${s.liveComparison?.provenance==='LIVE'?'':'disabled'}>Save Regression</button>
 </div>
 <p class="muted">Operator-only signing on LIVE_AUTHORIZED server. Judges never receive private keys. Protocol: ethrex first → StorageReadNonSender + unchanged nonce → same signed bytes to Skandha. No automatic retry. Inclusion checked separately.</p>
 ${live?`<details ${live.blockers?.length?'open':''}><summary>Live blockers / stake / binding</summary>
  <ul>${(live.blockers??[]).map(b=>`<li>${esc(b)}</li>`).join('')||'<li>None</li>'}</ul>
  <p class="mono tiny">deployment ${esc(live.deployment?.status)} · bound ${esc(live.deployment?.boundMode||live.deployment?.bound)} · stake ${esc(live.stake?.status)} · nonce ${esc(live.nonce)}</p>
 </details>`:''}
 ${s.livePrepared?`<div class="alert"><strong>Prepared candidate</strong><p class="mono tiny">hash ${esc(s.livePrepared.candidate.hash)} · nonce ${esc(s.livePrepared.candidate.nonce)} · wallet ${esc(s.livePrepared.candidate.wallet)} · digest ${esc(s.livePrepared.candidate.sourceDigest)}</p>
  <p>Max fee exposure ≈ ${esc(s.livePrepared.approvalPacket?.maximumFeeExposureEth??'?')} ETH · writes: ${(s.livePrepared.approvalPacket?.writes||[]).map(esc).join(' → ')}</p></div>`:''}
 <h4 style="margin-top:16px">Live comparison table</h4>${liveTableHtml()}
 ${s.savedRegression?`<p class="tag ok">Saved ${esc(s.savedRegression.file)} · digest ${esc(s.savedRegression.contentDigest)} · Arkiv ${esc(s.savedRegression.arkivPublication?.status)}</p>`:''}
 ${s.liveComparison?`<details><summary>Full LIVE comparison JSON</summary><pre class="details">${esc(JSON.stringify(s.liveComparison,null,2))}</pre></details>`:''}`
 :`<p class="muted">Use <strong>Load supported scenario</strong>, then Analyze with contract ViolatingWallet.</p>
 <details><summary>Generic readiness blockers</summary><ul>${(r?.blockers??[]).map(b=>`<li>${esc(b)}</li>`).join('')||'<li>Analyze first</li>'}</ul></details>`}
 </section>`;
}
function analysisHtml(){const a=s.analysis;
 const primary=admissionHtml();
 if(!a)return `${primary}<p class="muted" style="margin-top:12px">Choose a mode, then analyze. Live admission is the primary BYOC product path.</p>`;
 return `${primary}
 <details style="margin-top:16px"><summary>Compiler / ABI facts (secondary)</summary>
 <p><strong>${esc(a.status)}</strong> · profile ${esc(a.profile?.id??'byoc')} · ${esc(a.compiler??'profile/source')} · digest ${esc(a.sourceDigest)}</p>${a.analysisId?`<p class="mono tiny">Analysis identity: ${esc(a.analysisId)}</p>`:''}
 <p>Role: ${esc(a.detectedRole?.role??'UNKNOWN')} (${esc(a.detectedRole?.basis??'No role evidence')}).</p>
 <p>Available: ${esc(a.capabilities?.join(', ')||'None')}. Missing: ${esc(a.missingPrerequisites?.join('; ')||'None listed')}.</p>
 ${a.profile?.historicalEvidence?`<p class="alert">Historical live capture ${esc(a.profile.historicalEvidence.capturedAt)} · report digest ${esc(a.profile.historicalEvidence.reportDigest)}. This is not a fresh EIP-8141 run.</p>`:''}
 ${a.functions?`<p>${a.functions.length} ABI functions · ${(a.structure?.variables||[]).length} state vars · ${(a.structure?.events||[]).length} events · ${(a.structure?.externalCalls||[]).length} external call sites.</p><details><summary>Verified facts</summary><pre class="details">${esc(JSON.stringify({functions:a.functions,facts:a.sourceFacts,profile:a.profile},null,2))}</pre></details>`:''}
 ${a.diagnostics?.length?`<details ${a.status!=='READY'?'open':''}><summary>Diagnostics / profile notices</summary><pre class="details">${esc(JSON.stringify(a.diagnostics,null,2))}</pre></details>`:''}
 </details>
 ${arkivIntelHtml()}`;
}
function resultsHtml(){const r=s.report;if(!r)return `<p class="muted">${s.phase==='INVESTIGATING'?'Only actual agent requests and completed tool events appear below.':'No investigation result yet.'}</p>`;
 const entries=r.workspace.proposals.filter(e=>s.filter==='all'||s.filter==='executed'&&e.state==='EXECUTED'||s.filter==='negative'&&e.proposal.expectedVerdict==='REJECT'||s.filter==='unexpected'&&e.outcome?.findingCandidate||s.filter==='invalid'&&['INVALID','DUPLICATE','UNSUPPORTED'].includes(e.feasibility?.effective)||s.filter==='missing'&&e.feasibility?.effective==='CONDITIONAL');
 const budgetFail=/input too large|USD budget exhausted|token budget exhausted|call limit|Agent budget exhausted|SPRINT_BUDGET/i.test(r.error||s.error||'');
 return `<div class="alert"><strong>${esc(r.source)} · ${esc(r.profileId||'byoc')} · ${esc(r.status)}</strong><p>${r.realModelCalls} genuine model calls · ${r.provider.calls} transport requests · $${Number(r.provider.transport==='OPENROUTER'?r.provider.costUSD:0).toFixed(8)} paid/accounted. EVM executed: ${r.evmExecuted}. Admission verified: ${r.admissionVerified}. Verified vulnerability: ${r.verifiedVulnerability}.</p>
 ${r.budget?`<p class="muted">Run budget: allocated $${Number(r.budget.allocatedUSD).toFixed(4)} · est. finish $${Number(r.budget.estimatedFinishUSD).toFixed(4)} · sprint remaining before start $${Number(r.budget.sprintRemainingBefore).toFixed(4)}</p>`:''}
 ${r.error?`<p class="${budgetFail?'tag warn':''}">${budgetFail?'Budget/limit gate: ':''}${esc(r.error)}</p>`:''}
 ${(r.partialErrors||[]).length?`<p class="muted">Partial continuation after: ${esc(r.partialErrors.join(' · '))}</p>`:''}</div>
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
 if($('byocBudget')){
  const plan=s.config?.investigationBudget?.[s.mode==='uniswap-v4-paymaster'?'uniswap':'byoc'];
  $('byocBudget').textContent=s.budget
   ?`Sprint ${s.budget.sprintId||''}: $${Number(s.budget.remainingUSD).toFixed(4)} remaining / $${Number(s.budget.capUSD).toFixed(2)} cap (spent $${Number(s.budget.spentUSD).toFixed(4)}) · per-run allocate ~$${Number(plan?.allocatedUSD??0).toFixed(2)} · est. finish ~$${Number(plan?.estimatedFinishUSD??0).toFixed(2)} · OpenRouter key limit is separate`
   :'Budget unknown';
 }
 $('byocAnalysis').innerHTML=analysisHtml();$('byocPanels').innerHTML=`<h2>Live agent sessions</h2>${agentCards()}<h2 style="margin-top:24px">Mutation workbench & experiment results</h2>${resultsHtml()}${s.replay?`<pre class="details">${esc(JSON.stringify(s.replay,null,2))}</pre>`:''}${s.timeline.length?`<details><summary>Trace (${s.timeline.length} events)</summary><pre class="details">${esc(JSON.stringify(s.timeline,null,2))}</pre></details>`:''}`;
 $('byocFilter')?.addEventListener('change',e=>{s.filter=e.target.value;paint();});
 $('liveWallet')?.addEventListener('change',e=>{s.liveWallet=e.target.value.trim();});
 $('liveForeign')?.addEventListener('change',e=>{s.liveForeign=e.target.value.trim();});
 $('liveOwner')?.addEventListener('change',e=>{s.liveOwner=e.target.value.trim();});
 $('liveBindScenario')?.addEventListener('click',()=>{
  const f=s.config?.supportedScenario?.fixtures;if(!f){s.error='Supported scenario fixtures unavailable';paint();return;}
  s.liveWallet=f.wallet;s.liveForeign=f.foreign;s.liveOwner=f.owner;s.scenarioKind=s.config.supportedScenario.kind;s.error='';paint();
 });
 $('liveRefresh')?.addEventListener('click',async()=>{try{s.liveWallet=$('liveWallet')?.value.trim()||s.liveWallet;s.liveForeign=$('liveForeign')?.value.trim()||s.liveForeign;s.liveOwner=$('liveOwner')?.value.trim()||s.liveOwner;await refreshLiveReadiness();s.error='';}catch(e){s.error=e.message;}paint();});
 $('livePrepare')?.addEventListener('click',async()=>{s.liveWallet=$('liveWallet')?.value.trim()||'';s.liveForeign=$('liveForeign')?.value.trim()||'';s.liveOwner=$('liveOwner')?.value.trim()||'';await prepareLive();});
 $('liveRun')?.addEventListener('click',()=>runLive());
 $('liveSaveRegression')?.addEventListener('click',()=>saveRegression());
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
function invalidate(){const oldJob=s.job;if(oldJob&&['INVESTIGATING','CANCELLING'].includes(s.phase))request('cancel',{id:oldJob}).catch(()=>{});s.controller?.abort();s.version++;s.analysis=null;s.admission=null;s.report=null;s.job=null;s.timeline=[];s.replay=null;s.arkivImport=null;s.arkivPublish=null;s.livePrepared=null;s.liveComparison=null;s.liveJobId=null;s.savedRegression=null;s.phase='IDLE';s.error='Context changed: previous conclusions invalidated.';if($('byocConsent'))$('byocConsent').checked=false;paint();}
async function refreshLiveReadiness(){
 if(!s.analysis?.analysisId)return;
 const q=new URLSearchParams({analysisId:s.analysis.analysisId});
 if(s.liveWallet)q.set('wallet',s.liveWallet);if(s.liveForeign)q.set('foreign',s.liveForeign);if(s.liveOwner)q.set('owner',s.liveOwner);
 const r=await request('admission-readiness?'+q.toString());s.admission=r;
}
async function prepareLive(){
 s.error='';s.liveComparison=null;s.savedRegression=null;paint();
 try{
  const prepared=await request('live-prepare',{analysisId:s.analysis.analysisId,sourceDigest:s.analysis.sourceDigest,wallet:s.liveWallet,owner:s.liveOwner,foreign:s.liveForeign,verifyData:'0x01'});
  s.livePrepared=prepared;s.liveJobId=prepared.id;s.phase='PREPARED';
 }catch(e){s.error=e.message;}
 paint();
}
async function runLive(){
 if(!s.livePrepared?.candidate?.hash){s.error='Prepare a fresh candidate first.';paint();return;}
 if(!s.config?.liveAuthorized){s.error='Operator server must run with --mode LIVE_AUTHORIZED.';paint();return;}
 const pkt=s.livePrepared.approvalPacket||{};
 const ok=confirm(`Approve bounded LIVE writes?\n\nHash: ${s.livePrepared.candidate.hash}\nNonce: ${s.livePrepared.candidate.nonce}\nMax fee exposure: ~${pkt.maximumFeeExposureEth??'?'} ETH\nOrder: ethrex first, then Skandha only after policy rejection.\nNo automatic retry. Inclusion is separate from admission.`);
 if(!ok)return;
 s.phase='LIVE_COMPARING';s.error='';paint();
 try{
  const result=await request('live-run',{id:s.livePrepared.id,confirmHash:s.livePrepared.candidate.hash,authorizeWrites:true},AbortSignal.timeout(120000));
  if(result.comparison?.provenance!=='LIVE')throw Error('Refusing non-LIVE result');
  s.liveComparison=result.comparison;s.phase=result.state;s.liveJobId=result.id;s.livePrepared=null;
 }catch(e){s.error=e.message;s.phase='INCOMPLETE';s.livePrepared=null;}
 paint();
}
async function saveRegression(){
 if(s.liveComparison?.provenance!=='LIVE'){s.error='Save Regression requires a fresh LIVE comparison.';paint();return;}
 try{
  const saved=await request('save-regression',{id:s.liveJobId,analysisId:s.analysis?.analysisId,sourceDigest:s.analysis?.sourceDigest});
  s.savedRegression=saved;s.error='';
 }catch(e){s.error=e.message;}
 paint();
}
async function loadSupportedScenario(){
 try{
  const scen=await request('supported-scenario');
  const source=scen.source||'';
  invalidate();
  s.source=source;s.contractName=scen.contractName;s.role='SENDER_VALIDATOR';
  s.liveWallet=scen.fixtures?.wallet||'';s.liveForeign=scen.fixtures?.foreign||'';s.liveOwner=scen.fixtures?.owner||'';
  s.scenarioKind=scen.kind;
  s.error='Supported scenario loaded — Analyze next. Reference evidence is not LIVE.';
  if($('byocSource'))$('byocSource').value=s.source;
  if($('byocRole'))$('byocRole').value='SENDER_VALIDATOR';
 }catch(e){s.error=e.message;}
 paint();
}
async function analyze(){const version=++s.version;s.phase='ANALYZING';s.error='';s.controller=new AbortController();paint();try{
 const input=s.mode==='byoc'?{source:s.source,role:s.role,profile:'byoc',...(s.contractName?{contractName:s.contractName}:{}),...(s.abi.trim()?{abi:JSON.parse(s.abi)}:{})}:{profile:s.mode};
 const a=await request('analyze',input,AbortSignal.any([s.controller.signal,AbortSignal.timeout(20000)]));if(version!==s.version)return;
 s.analysis=a;s.contracts=a.contracts??[];s.phase=a.status;s.contractName=a.contractName??s.contractName;if(a.source&&s.mode!=='byoc')s.source=a.source;
 if(s.mode==='byoc'&&a.analysisId){try{const r=await request('admission-readiness?analysisId='+encodeURIComponent(a.analysisId));if(version===s.version)s.admission=r;}catch(e){if(version===s.version)s.admission={classification:'BLOCKED_PRECONDITION',blockers:[e.message]};}}
 const select=$('byocContract');if(select){select.innerHTML='<option value="">Auto-select single contract</option>'+(s.contracts||[]).map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');select.value=s.contractName||'';}
 }catch(e){if(version===s.version){s.error=e.name==='AbortError'?'Analysis cancelled':e.message;s.phase='INCOMPLETE';}}if(version===s.version)paint();}
async function start(){if(!$('byocConsent')?.checked){s.error='Explicit consent is required before any model requests.';paint();return;}const version=s.version;s.phase='INVESTIGATING';s.error='';s.report=null;s.timeline=[];paint();
 const plan=s.config?.investigationBudget?.[s.mode==='uniswap-v4-paymaster'?'uniswap':'byoc'];
 if(plan?.blockers?.length){s.error=plan.blockers[0];s.phase='INCOMPLETE';paint();return;}
 try{const job=await request('start',{analysisId:s.analysis.analysisId,sourceDigest:s.analysis.sourceDigest,authorizeProvider:true,budgetUSD:plan?.allocatedUSD});if(version!==s.version){request('cancel',{id:job.id}).catch(()=>{});return;}s.job=job.id;
  while(version===s.version){const current=await request('job?id='+encodeURIComponent(s.job));if(version!==s.version)return;s.timeline=current.timeline??[];s.report=current.report;s.phase=current.state==='RUNNING'?s.phase:current.state;if(current.error)s.error=current.error;paint();if(current.state!=='RUNNING')break;await new Promise(r=>setTimeout(r,500));}
  try{s.budget=await request('budget');}catch{}paint();
 }catch(e){if(version===s.version){s.error=e.message;s.phase='INCOMPLETE';paint();}}
}
export function renderPlayground(){return `<section class="card"><div class="eyebrow">FrameFuzz product path</div><h1>Live admission · Contract · Registry</h1><p class="summary">Primary demo: paste the supported ViolatingWallet source, prepare a fresh signed candidate, run ethrex→Skandha comparison, and save a local regression. AI agents remain available but are optional for the live admission demo.</p>
 <div class="row" id="byocModes">${[['byoc','Bring Your Own Contract'],['uniswap-v4-paymaster','Uniswap Paymaster Admission'],['regression-registry','Regression Registry']].map(([id,label])=>`<button class="btn ${s.mode===id?'btn-primary':'btn-secondary'}" data-mode="${id}" type="button">${label}</button>`).join('')}</div>
 <p class="alert" id="byocModeHelp"></p><p class="muted" id="byocBudget">Budget…</p>
 <div id="byocSourceWrap"><div class="row" style="margin-bottom:8px"><button class="btn btn-secondary" id="loadSupportedScenario" type="button">Load supported scenario</button></div>
 <label class="field">Solidity source<textarea id="byocSource" class="byoc-editor" spellcheck="false" placeholder="Paste StorageAccessValidator.sol (Foreign + ViolatingWallet)…">${esc(s.source)}</textarea></label><p class="muted">solc 0.8.28 · ≤64 KiB · HegotaSupport imports allowed only from local @forshtat/hegota-support · live path = labeled storage-access validator (supported scenario), not silent BYOC deploy.</p>
 <div class="grid-2"><label class="field">Optional ABI JSON<textarea id="byocAbi" class="byoc-abi" spellcheck="false">${esc(s.abi)}</textarea></label><div><label class="field">Contract name<select id="byocContract"><option value="">Auto-select</option></select></label><label class="field">Declared role<select id="byocRole">${['UNKNOWN','EXECUTION_TARGET','SENDER_VALIDATOR','PAYMASTER'].map(r=>`<option ${s.role===r?'selected':''}>${r}</option>`).join('')}</select></label></div></div></div>
 <div class="row"><button class="btn btn-primary" id="byocAnalyze">Detect / Analyze</button><button class="btn btn-secondary" id="byocCancel">Cancel</button></div><p id="byocStatus" role="status" aria-live="polite"></p><div id="byocAnalysis"></div>
 <hr><label class="row"><input type="checkbox" id="byocConsent"> Consent placeholder</label><p class="muted" id="byocConfig">Reading configuration…</p><button class="btn btn-primary" id="byocStart">Start Investigation</button></section><section class="card" id="byocPanels"></section>`;}
function modeHelp(){return s.mode==='byoc'?'BYOC live product: Load supported ViolatingWallet scenario → Analyze → Prepare → Run Live Comparison → Save Regression. Agents optional; do not burn OpenRouter on ABI-only demos.':s.mode==='uniswap-v4-paymaster'?'Uniswap: StateView + historical public/alt evidence + Arkiv discovery. Predictions are not fresh admissions.':'Registry: discover published suites, unsigned import, operator publish confirmation under the fee ceiling.';}
export function bindPlayground(){s.active=true;document.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>{if(s.mode===btn.dataset.mode)return;s.mode=btn.dataset.mode;invalidate();document.querySelectorAll('[data-mode]').forEach(b=>b.className=`btn ${b.dataset.mode===s.mode?'btn-primary':'btn-secondary'}`);$('byocModeHelp').textContent=modeHelp();paint();}));
 $('byocModeHelp').textContent=modeHelp();
 $('byocSource')?.addEventListener('input',e=>{s.source=e.target.value;s.contractName='';s.contracts=[];invalidate();});
 $('byocAbi')?.addEventListener('input',e=>{s.abi=e.target.value;invalidate();});
 $('byocRole')?.addEventListener('change',e=>{s.role=e.target.value;invalidate();});
 $('byocContract')?.addEventListener('change',e=>{s.contractName=e.target.value;invalidate();});
 $('loadSupportedScenario')?.addEventListener('click',loadSupportedScenario);
 $('byocAnalyze').addEventListener('click',analyze);$('byocStart').addEventListener('click',start);$('byocCancel').addEventListener('click',cancel);paint();
 request('config').then(c=>{s.config=c;s.budget=c.sprintBudget;if(s.active){
  const r=c.investigationReadiness;
  const plan=c.investigationBudget?.[s.mode==='uniswap-v4-paymaster'?'uniswap':'byoc'];
  $('byocConfig').textContent=c.canStart
    ?`${c.transport} · ${c.model} · READY · mode ${r?.mode??c.capabilityMode??'n/a'} · OpenRouter key ${r?.openRouterKeyPresent?'loaded':'missing'} · sprint $${Number(c.sprintBudget?.remainingUSD??0).toFixed(4)} remaining · run ~$${Number(plan?.allocatedUSD??0).toFixed(2)} (est. finish ~$${Number(plan?.estimatedFinishUSD??0).toFixed(2)})`
    :`${c.transport} · ${c.model} · investigations disabled — ${r?.notice||'see investigationReadiness'}`;
  const checkbox=$('byocConsent');checkbox.parentElement.lastChild.textContent=c.transport.startsWith('MOCK')?' I authorize this mocked test-transport investigation; no paid model.':` I consent to OpenRouter Sonnet under the FrameFuzz sprint budget (cap $${c.sprintBudget?.capUSD??1}, remaining $${Number(c.sprintBudget?.remainingUSD??0).toFixed(4)}); OpenRouter account limits are separate; no blockchain/Arkiv writes until I start.`;
  paint();
 }}).catch(e=>{s.error=e.message;paint();});
}
export function leavePlayground(){if(isBusy())cancel();s.active=false;}
