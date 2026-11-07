import {OpenRouterProvider} from '../../src/swarm/provider.mjs';
export const CONTRACT_A='// SPDX-License-Identifier: MIT\npragma solidity ^0.8.28;\ncontract FreshQuotaJournal {\n uint public total;\n event Added(uint8 amount);\n function addQuota(uint8 amount) external { require(amount > 0, "positive"); total += amount; emit Added(amount); }\n}';
export const CONTRACT_B='// SPDX-License-Identifier: MIT\npragma solidity ^0.8.28;\ncontract FreshBadgeDirectory {\n bytes4 public current;\n function saveBadge(bytes4 badge, bool enabled) external { require(enabled, "disabled"); current = badge; }\n}';
export function byocProposal(facts,{id='edge-1',invalid=false,abiTool=false,variant=0}={}){
 const fn=facts.functions.find(f=>f.stateMutability!=='view'&&f.inputs.length>0)??facts.functions[0];
 const ints=['2','3','4','5'];
 const value=(type,changed)=>type.startsWith('uint')||type.startsWith('int')?(changed?ints[variant%ints.length]:'1'):type==='bool'?(changed?(variant%2?'false':'true'):'true'):type==='bytes4'?(changed?(variant? '0xaabbccdd':'0xdeadbeef'):'0x11223344'):type==='address'?'0x0000000000000000000000000000000000000001':changed?('b'+variant):'a';
 return {id,analysisId:facts.analysisId,sourceDigest:facts.sourceDigest,functionSignature:invalid?'nonexistent(uint8)':fn.signature,originalArgs:fn.inputs.map(p=>value(p.type,false)),mutatedArgs:fn.inputs.map((p,i)=>abiTool&&i===0?'256':value(p.type,true)),tool:'abi_encode',domain:abiTool?'ABI_TOOL_TEST':'ABI_ENCODING',expectedVerdict:abiTool?'REJECT':'ACCEPT',negativeObjective:abiTool?'ABI_REJECTION':'NONE',preconditions:[],factIds:[facts.sourceFacts.find(f=>f.kind==='function')?.id??facts.sourceFacts[0].id],hypothesis:abiTool?'Explicit ABI encoder conformance for an out-of-range typed argument':'Probe an encodable mutation of this compiled external function',evidenceNeeded:abiTool?'ABI encoder rejection only; not contract or admission evidence':'Actual ABI encoding acceptance without EVM or admission claims'};
}
export function byocTestProvider({forceRepair=true,followUp=false,readTool=false,inspect=()=>{},failure=false,stall=false,timeoutMs=45000}={}){
 const counts={};
 return new OpenRouterProvider({env:{OPENROUTER_API_KEY:'explicit-mock-transport-not-a-real-key'},testTransport:true,limits:{maxCalls:10,timeoutMs},fetchImpl:async(_,request)=>{
  if(stall)return new Promise(()=>{});if(failure)return new Response('',{status:503});
  const body=JSON.parse(request.body),role=body.response_format.json_schema.name.replace('byoc_',''),messages=body.messages;counts[role]=(counts[role]??0)+1;
  const received=messages.filter(m=>m.role==='user').map(m=>{try{return JSON.parse(m.content).untrustedMessage;}catch{return null;}}).filter(Boolean);
  const facts=received.find(m=>m.type==='VERIFIED_COMPILER_FACTS').payload;inspect(role,{messages,received,facts,count:counts[role]});
  const common={summary:'Mock transport decision grounded in actual compiler facts; no paid model',questions:[],toolRequests:[]};let output;
  if(role==='scout')output={...common,findings:[{claim:'The submitted external function has typed ABI arguments and visible guard syntax',factIds:[facts.sourceFacts[0].id]}],opportunities:['Probe encodable mutations; keep ABI_TOOL_TEST separate from contract failure'],...(readTool&&counts.scout===1?{toolRequests:[{tool:'query_abi',startLine:1,endLine:1,functionSignature:'',proposalId:''}]}:{})};
  if(role==='mutation'){
   const hasUint8=facts.functions.some(f=>f.inputs[0]?.type==='uint8');
   const proposal=byocProposal(facts,{id:counts.mutation>1&&followUp&&!forceRepair?'edge-follow':'edge-1',invalid:forceRepair&&counts.mutation===1,abiTool:counts.mutation>1&&hasUint8&&forceRepair,variant:counts.mutation});
   output={...common,proposals:[proposal]};
  }
  if(role==='validator'){
   const proposals=received.filter(m=>m.type==='PROPOSALS').at(-1).payload.proposals;
   output={...common,decisions:proposals.map(p=>({proposalId:p.id,decision:p.functionSignature.startsWith('nonexistent')?'INVALID':'EXECUTABLE',reason:p.functionSignature.startsWith('nonexistent')?'Function does not exist in the supplied compiler ABI; use actual callable signature and encodable values':'Proposal matches a supported local tool domain',factIds:[facts.sourceFacts[0].id],repairRequired:p.functionSignature.startsWith('nonexistent')}))};
  }
  if(role==='critic')output={...common,assessment:'Observed local tool result is not Solidity runtime behavior or admission',unresolved:['Contract require/revert behavior still needs an EVM executor'],replayIds:['edge-1'],followUp:{requested:followUp,proposalId:'edge-1',instruction:followUp?'Probe another encodable typed boundary using actual prior observations':''}};
  return new Response(JSON.stringify({id:'mock-byoc-'+role,model:'MOCK_SONNET_TRANSPORT',usage:{total_tokens:200,cost:0.001},choices:[{finish_reason:'stop',message:{content:JSON.stringify(output)}}]}));
 }});
}
