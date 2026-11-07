import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {digest} from '../analysis/model.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const digestText=t=>createHash('sha256').update(t).digest('hex');
export const PROFILES=Object.freeze([
 {id:'byoc',title:'Bring Your Own Contract',summary:'Paste self-contained Solidity. Compiler/ABI/AST tools only unless an EVM executor is added.'},
 {id:'uniswap-v4-paymaster',title:'Uniswap v4 Paymaster Admission',summary:'Investigate ReserveReadingPaymaster StateView.getSlot0 integration against historical public/alternative admission evidence. No swap or USDC reimbursement claim.'},
 {id:'regression-registry',title:'Regression Registry',summary:'Export verified investigations, prepare Arkiv Rabdi publication manifests, query and import unsigned previews.'},
]);
async function loadJson(rel){return JSON.parse(await readFile(path.join(root,rel),'utf8'));}
export async function loadUniswapProfileAnalysis(){
 const source=await readFile(path.join(root,'vendor/paymaster/ReserveReadingPaymaster.sol'),'utf8');
 const config=await loadJson('examples/live/devnet.json');
 const live=await loadJson('evidence/live/2026-11-06/2026-11-05T22-04-27-896Z-LIVE_RPC_SUBMISSION-3a838bca.json');
 const finalLive=await loadJson('evidence/live/2026-11-07/uniswap-policy-divergence-final.json');
 const staked=live.results?.find(r=>/staked/i.test(r.id||''))??live.results?.find(r=>r.id==='staked-baseline-50000');
 const unstaked=live.results?.find(r=>/unstaked/i.test(r.id||''));
 const altInclusion=staked?.paths?.find(p=>p.id==='alt');
 const publicPath=staked?.paths?.find(p=>p.id==='public');
 const sourceDigest=digestText(source);
 const lines=source.split(/\r?\n/);
 const slotLine=lines.findIndex(l=>l.includes('getSlot0'))+1;
 const facts=[
  {id:'paymaster-fallback',kind:'function',file:'vendor/paymaster/ReserveReadingPaymaster.sol',startLine:27,endLine:37,sourceDigest,claim:'fallback verifies and optionally reads Uniswap v4 StateView.getSlot0 before approving PAYMENT'},
  {id:'stateview-call',kind:'external-call',file:'vendor/paymaster/ReserveReadingPaymaster.sol',startLine:slotLine||33,endLine:slotLine||33,sourceDigest,claim:'IStateView(STATE_VIEW).getSlot0(POOL_ID) is a real Uniswap v4 pool-state staticcall during verification'},
  {id:'stake-comment',kind:'comment',file:'vendor/paymaster/ReserveReadingPaymaster.sol',startLine:15,endLine:17,sourceDigest,claim:'Source documents unstaked external storage read rejection versus staked alternative-mempool admission'},
 ];
 const historicalEvidence={
  classification:'CAPTURED_LIVE_EVIDENCE',
  capturedAt:finalLive.observedAt,
  reportPath:'evidence/live/2026-11-07/uniswap-policy-divergence-final.json',
  reportDigest:digest(finalLive),
  chainId:finalLive.chainId,
  flagship:{transactionIdentity:finalLive.transactions.candidate,canonical:finalLive.comparison.canonical,alternative:finalLive.comparison.alternative,inclusion:finalLive.inclusion,claims:finalLive.claims},
  stakedCase:{id:staked?.id??null,public:{expected:publicPath?.expected??null,admission:publicPath?.observed??publicPath?.admission??null,hash:publicPath?.receipt?.transactionHash??null},alt:{expected:altInclusion?.expected??null,admission:altInclusion?.observed??altInclusion?.admission??null,hash:altInclusion?.receipt?.transactionHash??null,inclusionHash:'0xbb9143eb2964bdc4de9d59f15404baf14f59465f0ac0f5d5903dfa0173741b6c'}},
  unstakedCase:{id:unstaked?.id??null},
  limitations:['Historical evidence is not a fresh EIP-8141 run','Zero or uninitialized pool state is not swap execution','No USDC reimbursement claim','Pinned code hashes are runtime-checked only when live inspection succeeds'],
 };
 const uniswapContext={
  sourceFile:'vendor/paymaster/ReserveReadingPaymaster.sol',
  interaction:'StateView.getSlot0(bytes32)',
  stateView:config.stateView,
  poolManager:config.poolManager,
  poolId:config.poolId,
  pinnedCodeHashes:config.uniswapCodeHashes,
  paymasters:config.paymasters,
  supportedMutations:['uniswap-storage staked vs unstaked external storage read','public vs alternative admission oracle','verification-gas near versioned payer cap','missing payer/stake/deployment prerequisites → CONDITIONAL'],
  notSupported:['Uniswap swap execution','USDC gas reimbursement','active trading proofs','treating pasted generic contracts as this paymaster'],
 };
 const analysisId=digestText(JSON.stringify({profile:'uniswap-v4-paymaster',sourceDigest,reportDigest:historicalEvidence.reportDigest}));
 return {
  status:'READY',analysisId,sourceDigest,source,contractName:'ReserveReadingPaymaster',compiler:null,abi:[],abiDigest:null,
  declaredRole:'PAYMASTER',detectedRole:{role:'PAYMASTER',basis:'ReserveReadingPaymaster inherits HegotaSupport and approves PAYMENT after optional StateView read'},
  contracts:['ReserveReadingPaymaster'],functions:[],diagnostics:[{severity:'info',message:'Vendor paymaster imports HegotaSupport; BYOC solc intake cannot compile imports. Profile supplies verified source excerpts, pinned addresses and historical live evidence instead.'}],
  structure:{functions:[{name:'fallback',startLine:27,endLine:37}],variables:[{name:'STATE_VIEW'},{name:'POOL_ID'}],events:[],guards:[],externalCalls:[{name:'getSlot0',startLine:slotLine||33,endLine:slotLine||33}]},
  sourceFacts:facts,capabilities:['CAPTURED_LIVE_EVIDENCE','UNISWAP_STATEVIEW_CONTEXT','POLICY_PREDICTION','STRUCTURAL_SOURCE_CHECK','LIVE_UNISWAP_ADMISSION_PREPARE'],
  missingPrerequisites:['LIVE_AUTHORIZED_OPERATOR_FOR_FRESH_RUN','EXPLICIT_OPERATOR_CONFIRMATION_BEFORE_BROADCAST','SWAP_AND_USDC_REIMBURSEMENT_NOT_IMPLEMENTED'],
  limitations:['Agents may inspect source and historical public/alt outcomes','New predictions remain POLICY_PREDICTION with observedVerdict=null unless a separately approved live run executes','Generic pasted contracts never inherit this profile'],
  profile:{id:'uniswap-v4-paymaster',title:'Uniswap v4 Paymaster Admission',summary:PROFILES[1].summary,historicalEvidence,uniswapContext},
 };
}
