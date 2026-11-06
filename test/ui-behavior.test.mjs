// Executes the real SPA functions with a minimal DOM double, not a browser engine.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {BRIEFING,SLIDES,FAQ} from '../web/js/briefing.js';
import * as utils from '../web/js/utils.js';

const source=(await readFile(new URL('../web/js/app.js',import.meta.url),'utf8'))
  .replace(/import[\s\S]*?from ['"][^'"]+['"];\s*/g,'').replace(/boot\(\);\s*$/,'');
function ui(api={}){
  const nodes=new Map(),rows=[];
  const element=(id)=>({id,value:'',dataset:{},classList:{add(){},remove(){},toggle(){}},listeners:{},setAttribute(k,v){this[k]=v;},addEventListener(k,fn){this.listeners[k]=fn;},click(){this.listeners.click?.();}});
  for(const id of ['pageRoot','modePill','networkPill','demoMode','mutationSeed','mutationCount','mutationSuite','efNotes'])nodes.set(id,element(id));
  const document={getElementById:id=>nodes.get(id),querySelectorAll:selector=>selector==='tr[data-case]'||selector==='[data-case]'?rows:[],querySelector:()=>null,body:{classList:{add(){},remove(){}}}};
  const context=vm.createContext({...utils,BRIEFING,SLIDES,FAQ,document,sessionStorage:{getItem:()=>null},window:{scrollTo(){}},api,console,AbortController,URLSearchParams});
  vm.runInContext(source+'\nglobalThis.ui={state,render,renderCampaigns,renderEvidence,bindPage,onKey,coverageHtml,queryCommunity,cancelCommunity,selectCommunity};',context);
  return {...context.ui,nodes,rows,element};
}
test('campaign and community inputs survive real SPA rerenders',()=>{
  const u=ui();u.state.page='campaigns';u.bindPage();
  const seed=u.nodes.get('mutationSeed');seed.value='123';seed.listeners.input();
  seed.value='42';u.render();assert.equal(seed.value,'123');
});
test('evidence detail follows filtered rows and clears on empty matches',()=>{
  const u=ui();u.state.active={source:'PREVIEW',results:[{id:'accepted',paths:[{observed:{status:'accepted'}}]},{id:'rejected',paths:[{observed:{status:'rejected'}}]}]};
  u.state.selectedCase=0;u.state.evidenceFilter='rejected';u.renderEvidence();assert.equal(u.state.selectedCase,1);
  u.state.evidenceFilter='included';u.renderEvidence();assert.equal(u.state.selectedCase,-1);
});
test('case rows support keyboard selection through the actual click handler',()=>{
  const u=ui(),row=u.element('row');row.dataset.case='2';u.rows.push(row);u.state.page='overview';u.bindPage();
  assert.equal(row.tabIndex,0);let prevented=false;row.listeners.keydown({key:'Enter',preventDefault(){prevented=true;}});
  assert.equal(u.state.selectedCase,2);assert.equal(prevented,true);
});
test('presentation arrow navigation leaves editable fields and modified shortcuts alone',()=>{
  const u=ui();u.state.presenting=true;
  u.onKey({key:'ArrowRight',target:{closest:()=>true},preventDefault(){assert.fail('typing must retain arrows');}});assert.equal(u.state.slideIndex,0);
  u.onKey({key:'ArrowRight',target:{closest:()=>false},preventDefault(){}});assert.equal(u.state.slideIndex,1);
});
test('coverage view renders report values and bounded shrink metadata without inventing a result',()=>{
  const u=ui();const html=u.coverageHtml({coverage:{rules:[{ruleId:'TEST_RULE',path:'alt',variants:7,matched:6,unexpected:1,regions:['at','above'],verified:7,inferred:0,unknown:0}]},results:[{id:'case',reproduction:{shrink:{automatic:false,maxAttempts:8}}}]});
  assert.match(html,/7 variants, 6 matches, 1 unexpected/);assert.match(html,/maxAttempts/);assert.match(html,/never automatically probes/);
});

test('registry stale responses cannot replace results after cancellation or newer query',async()=>{
  const pending=[];const u=ui({community:()=>new Promise(resolve=>pending.push(resolve))});u.state.page='arkiv';
  const first=u.queryCommunity();assert.equal(u.state.communityBusy,true);
  u.cancelCommunity();const second=u.queryCommunity();
  const result=source=>({source,cases:[],rejected:[],reader:{walletAddress:null},discovery:{notice:'bounded'}});
  pending[1](result('new'));await second;assert.equal(u.state.community.source,'new');assert.equal(u.state.communityPhase,'empty');
  pending[0](result('old'));await first;assert.equal(u.state.community.source,'new');
});
test('registry timeout and error leave saved snapshot fallback available',async()=>{
  const error=new Error('deadline');error.name='TimeoutError';const u=ui({community:async()=>{throw error;}});u.state.page='arkiv';
  await u.queryCommunity();assert.equal(u.state.communityPhase,'timeout');assert.equal(u.state.communityBusy,false);assert.match(u.state.communityStatus,/Saved snapshots/);
});
