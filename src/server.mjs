import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectCases } from './selection.mjs';
import { runSuite } from './runner.mjs';
import { listReports, loadReport, saveReport, toMarkdown, toReplay } from './reports.mjs';
import { SCENARIOS } from './scenarios.mjs';
import { getChainId, sanitizedRpcLabel } from './rpc.mjs';
import { assertTestChain, redact } from './safety.mjs';
import {runMutationCampaign,MAX_LIVE_MUTATIONS,DEFAULT_CONFIG,DEFAULT_RULES} from './mutations/campaign.mjs';
import {MUTATION_SUITES} from './mutations/generator.mjs';
import {createRegistry} from './arkiv/registry.mjs';
import {createSwarmRoutes} from './swarm/http.mjs';
import {ApiError,readJsonObject,readDeadline} from './http-errors.mjs';
import {EXECUTION_CHAINS} from './safety.mjs';
import {savedCommunity} from './arkiv/saved.mjs';
import {evidenceView} from './evidence-status.mjs';

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'web');
const STATIC_TYPES = { '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
function json(res, status, value) {
  if(res.destroyed||res.writableEnded)return;
  if(status===408)res.setHeader('connection','close');
  if(status>=400)value={...value,code:value.code??'REQUEST_REJECTED',category:status===504?'INFRASTRUCTURE_FAILURE':status>=500?'SERVER_ERROR':'PREREQUISITE_FAILURE',retryable:status===504};
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(JSON.stringify(value));
}
async function serveStatic(res, pathname) {
  const rel = pathname.replace(/^\/+/, '');
  if (!rel || rel.includes('..') || path.isAbsolute(rel)) return false;
  const allowed = /^(css|js|assets)\/[A-Za-z0-9._/-]+$/.test(rel) || rel === 'favicon.svg';
  if (!allowed) return false;
  const file = path.resolve(WEB_ROOT, rel);
  if (!file.startsWith(WEB_ROOT + path.sep) && file !== WEB_ROOT) return false;
  const ext = path.extname(file).toLowerCase();
  if (!STATIC_TYPES[ext]) return false;
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': STATIC_TYPES[ext], 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
    res.end(body);
    return true;
  } catch { return false; }
}

export function createDashboardServer({ resultDir = 'runs', casesLocation = 'examples/cases', rpcUrl, rpcUrls = {}, scenario, adapterFile, rulesFile, allowChainId, submit = false, receiptWaitMs = 0,
  mutationConfigFile=DEFAULT_CONFIG,mutationRulesFile=DEFAULT_RULES,communityRegistry,offlineDemo=false,defaultRun,swarmRunner,swarmEnvironment=process.env,apiReadTimeoutMs=10000 }) {
  if(!Number.isSafeInteger(apiReadTimeoutMs)||apiReadTimeoutMs<1||apiReadTimeoutMs>15000)throw new Error('Invalid bounded API read timeout');
  let running = false;
  const configured = !offlineDemo&&Boolean(rpcUrl || (rpcUrls.public && rpcUrls.alt));
  const enabled = Boolean(submit && configured && EXECUTION_CHAINS.includes(allowChainId));
  const selectedReport=async id=>{if(!/^[\w.-]+\.json$/.test(id??''))throw new ApiError(400,'INVALID_REPORT_ID','Invalid report filename');try{return evidenceView(await loadReport(resultDir,id));}catch(e){if(e.code==='ENOENT')throw new ApiError(404,'REPORT_NOT_FOUND','Saved report not found');throw e;}};
  const swarmRoutes=createSwarmRoutes({resultDir,offlineDemo,getRunning:()=>running,setRunning:value=>{running=value;},runner:swarmRunner,env:swarmEnvironment});
  const server=http.createServer(async (req, res) => {
    const route = new URL(req.url, 'http://localhost');
    try {
      const requestHost = new URL(`http://${req.headers.host ?? ''}`).hostname;
      if (!['127.0.0.1', 'localhost', '[::1]'].includes(requestHost)) return json(res, 403, { error: 'Localhost Host header required' });
      if(req.method==='POST'&&req.headers.origin){let valid=false;try{valid=new URL(req.headers.origin).host===req.headers.host;}catch{}if(!valid)return json(res,403,{error:'Invalid Origin',code:'INVALID_ORIGIN'});}
      if(await swarmRoutes(req,res,route))return;
      if (req.method === 'GET' && route.pathname === '/') {
        const html = await readFile(path.join(WEB_ROOT, 'index.html'));
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
        res.end(html);
      } else if (req.method === 'GET' && await serveStatic(res, route.pathname)) {
        return;
      } else if (req.method === 'GET' && route.pathname === '/api/config') {
        json(res, 200, { offlineDemo,defaultRun,rpcConfigured: configured, submitEnabled: enabled, allowChainId: allowChainId ?? null, casesLocation, running,
          scenario: scenario ?? 'fixtures', scenarios: [{ id: 'fixtures', label: 'Signed case fixtures' }, ...(adapterFile && rulesFile ? SCENARIOS : [])],
          mutations:{suites:MUTATION_SUITES,maxLiveVariants:MAX_LIVE_MUTATIONS,maxPreviewVariants:1000},
          endpoints: Object.fromEntries(Object.entries({ default: rpcUrl, ...rpcUrls }).filter(([,v]) => v).map(([k,v]) => [k, sanitizedRpcLabel(v)])) });
      } else if(req.method==='GET'&&route.pathname==='/api/community/saved'){
        json(res,200,await savedCommunity({suite:route.searchParams.get('suite')||undefined,ruleId:route.searchParams.get('rule')||undefined,implementation:route.searchParams.get('implementation')||undefined,owner:route.searchParams.get('owner')||undefined}));
      } else if(req.method==='GET'&&route.pathname==='/api/community'){
        if(offlineDemo)return json(res,503,{error:'Saved-evidence offline mode: live Arkiv discovery is disabled. Inspect the saved imported PREVIEW in the evidence library; it is not a fresh query.'});
        for(const [key,value]of route.searchParams){if(!['suite','rule','implementation','owner'].includes(key)||value.length>160||!(/^[a-zA-Z0-9._:-]*$/.test(value)))throw new ApiError(400,'INVALID_FILTER','Invalid bounded Registry filter');}
        const registry=communityRegistry??createRegistry();
        json(res,200,await readDeadline(()=>registry.query({suite:route.searchParams.get('suite')||undefined,ruleId:route.searchParams.get('rule')||undefined,implementation:route.searchParams.get('implementation')||undefined,owner:route.searchParams.get('owner')||undefined}),apiReadTimeoutMs));
      } else if(req.method==='GET'&&route.pathname==='/api/community/case'){
        if(offlineDemo)return json(res,503,{error:'Live Arkiv reads are disabled in offline mode'});
        const key=route.searchParams.get('key');if(!/^0x[\da-f]{64}$/i.test(key??''))throw new ApiError(400,'INVALID_ENTITY_KEY','Entity key must be32-byte hex');
        json(res,200,await readDeadline(()=>(communityRegistry??createRegistry()).fetch(key),apiReadTimeoutMs));
      } else if(req.method==='POST'&&route.pathname==='/api/community/import'){
        if(offlineDemo)return json(res,503,{error:'Live Arkiv import is disabled in offline mode; use the saved imported PREVIEW or generate unsigned local mutations'});
        if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return json(res,403,{error:'Invalid Origin'});
        const selection=await readJsonObject(req,['key'],1024);
        if(!/^0x[\da-f]{64}$/i.test(selection.key??''))throw new ApiError(400,'INVALID_ENTITY_KEY','Entity key must be32-byte hex');
        if(selection.submit||Object.keys(selection).some(k=>k!=='key'))return json(res,400,{error:'Community cases support preview only; no submission or overrides'});
        const {retrieved,preview}=await readDeadline(()=>(communityRegistry??createRegistry()).importPreview(selection.key),apiReadTimeoutMs);
        const saved=await saveReport(preview,resultDir);
        json(res,200,{file:path.basename(saved.jsonFile),source:preview.source,submissions:preview.submissions,origin:preview.communityOrigin,owner:retrieved.owner});
      } else if (req.method === 'GET' && route.pathname === '/api/network') {
        if(offlineDemo)return json(res,200,{offlineDemo:true,endpoints:[]});
        const endpoints = Object.entries({ default: rpcUrl, ...rpcUrls }).filter(([, v]) => v);
        const status = await Promise.all(endpoints.map(async ([id, url]) => {
          try { const chainId = await getChainId(url, { timeoutMs: 3000 }); assertTestChain(chainId, allowChainId); return { id, rpc: sanitizedRpcLabel(url), chainId, state: 'chain_verified', writeHealth:'unverified', message:'Chain ID matches; mining, funding and write health are not checked' }; }
          catch (error) { return { id, rpc: sanitizedRpcLabel(url), state: 'unavailable', message: redact(error.message) }; }
        }));
        json(res, 200, { endpoints: status });
      } else if (req.method === 'GET' && route.pathname === '/api/cases') {
        const selected = route.searchParams.get('scenario') ?? scenario ?? 'fixtures';
        const cases = await selectCases({ casesLocation, scenario: selected, adapterFile, rulesFile });
        json(res, 200, { cases: cases.map(c => ({ id: c.id, family: c.family ?? 'fixtures', mutation: c.mutation?.family ?? 'baseline' })) });
      } else if (req.method === 'GET' && route.pathname === '/api/runs') {
        json(res, 200, { runs: await listReports(resultDir) });
      } else if (req.method === 'GET' && route.pathname === '/api/run') {
        json(res, 200, await selectedReport(route.searchParams.get('id')));
      } else if (req.method === 'GET' && route.pathname === '/api/export') {
        const report = await selectedReport(route.searchParams.get('id'));
        const format = route.searchParams.get('format') ?? 'json';
        if (!['json', 'markdown', 'replay'].includes(format)) return json(res, 400, { error: 'Unknown export format' });
        const content = format === 'markdown' ? toMarkdown(report) : JSON.stringify(format === 'replay' ? toReplay(report) : redact(report), null, 2);
        res.writeHead(200, { 'content-type': format === 'markdown' ? 'text/markdown; charset=utf-8' : 'application/json',
          'content-disposition': `attachment; filename="framefuzz-${format}.${format === 'markdown' ? 'md' : 'json'}"`, 'x-content-type-options': 'nosniff' });
        res.end(content);
      } else if(req.method==='POST'&&route.pathname==='/api/mutate'){
        if(running)return json(res,409,{error:'A test run is already executing'});
        if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return json(res,403,{error:'Invalid Origin'});
        running=true;
        try{
          const selection=await readJsonObject(req,['suite','seed','count','submit','preview']);
          if((selection.suite!==undefined&&!MUTATION_SUITES.includes(selection.suite))||['submit','preview'].some(k=>selection[k]!==undefined&&typeof selection[k]!=='boolean')||['seed','count'].some(k=>selection[k]!==undefined&&!Number.isSafeInteger(selection[k]))||selection.seed<0||selection.seed>0xffffffff||selection.count<1||selection.count>1000||(selection.suite==='uniswap-storage'&&selection.count>3))throw new ApiError(400,'INVALID_MUTATION','Invalid bounded mutation selection');
          const requestedSubmit=selection.submit===true;
          if(requestedSubmit&&selection.preview)throw new ApiError(400,'CONFLICTING_MODE','Preview and submission are mutually exclusive');
          if(requestedSubmit&&!enabled)return json(res,409,{error:'Mutation submission requires server --submit and explicitly configured authorized endpoints/chain'});
          const evidence=await runMutationCampaign({suite:selection.suite??'verification-gas',seed:selection.seed??42,count:selection.count??(selection.suite==='uniswap-storage'?3:7),
            preview:requestedSubmit?Boolean(selection.preview):true,submit:requestedSubmit,configFile:mutationConfigFile,rulesFile:mutationRulesFile,
            rpcUrl,rpcUrls,allowChainId,receiptWaitMs});
          const saved=await saveReport(evidence,resultDir);
          json(res,200,{success:true,file:path.basename(saved.jsonFile),source:evidence.source,totals:evidence.totals,coverage:evidence.coverage});
        }finally{running=false;}
      } else if (req.method === 'POST' && route.pathname === '/api/run') {
        // Local-only dev server, no general network access, and explicit flag to submit.
        if (!enabled) return json(res, 409, { error: 'Submissions are disabled. Configure RPC endpoints, --allow-chain, and --submit.' });
        if (running) return json(res, 409, { error: 'A test run is already executing' });
        const origin = req.headers.origin;
        const host = req.headers.host;
        if (origin && new URL(origin).host !== host) return json(res, 403, { error: 'Invalid Origin' });
        running = true;
        try {
          const selection=await readJsonObject(req,['scenario','caseId','mutationFamily']);
          if(Object.values(selection).some(v=>typeof v!=='string'||v.length>160))throw new ApiError(400,'INVALID_SELECTION','Invalid case selection');
          const cases = await selectCases({ casesLocation, scenario: selection.scenario ?? scenario, adapterFile, rulesFile,
            caseId: selection.caseId, mutationFamily: selection.mutationFamily });
          const evidence = await runSuite(cases, { rpcUrl, rpcUrls, allowChainId, submit: true, receiptWaitMs });
          const saved = await saveReport(evidence, resultDir);
          json(res, 200, { success: true, file: path.basename(saved.jsonFile), totals: evidence.totals });
        } finally { running = false; }
      } else json(res, 404, { error: 'Not found' });
    } catch (error) { json(res,error.status??500,{error:redact(error.message),code:error.code??'INTERNAL_ERROR'}); }
  });
  server.requestTimeout=10000;server.headersTimeout=5000;
  return server;
}
