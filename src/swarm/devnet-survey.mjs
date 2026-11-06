import {rpc} from '../rpc.mjs';
// Read-only discovery list. Intentionally independent of every execution allowlist.
export const SURVEY_NETWORKS=[1,2,3].map(id=>({id,rpc:`https://devnet${id}.altmempool.wtf`,gateway:`https://gateway${id}.altmempool.wtf`}));
const METHODS=new Set(['eth_chainId','web3_clientVersion','eth_getBlockByNumber','rpc_modules','skandha_explorer_info']);
export async function surveyDevnets({previous,rpcFn=rpc}={}){
 const observations=[];
 await Promise.all(SURVEY_NETWORKS.map(async network=>{
  const selections=previous?[[network.rpc,'eth_getBlockByNumber']]:[
   ...['eth_chainId','web3_clientVersion','eth_getBlockByNumber','rpc_modules'].map(m=>[network.rpc,m]),
   ...['eth_chainId','web3_clientVersion','skandha_explorer_info','rpc_modules'].map(m=>[network.gateway,m]),
  ];
  // Bound each host to sequential reads; never call send/simulate/admin/faucet methods.
  for(const [endpoint,method]of selections){
   if(!METHODS.has(method))throw new Error('Survey read allowlist violation');
   const item={network:network.id,endpoint,method,observedAt:new Date().toISOString()};
   try{item.result=await rpcFn(endpoint,method,method==='eth_getBlockByNumber'?['latest',false]:[],{timeoutMs:10000});}catch(e){item.error={name:e.name,code:e.code??null,causeCode:e.cause?.cause?.code??e.cause?.code??null,message:String(e.message).slice(0,180)};}
   observations.push(item);
  }
 }));
 const advancement=previous?SURVEY_NETWORKS.map(n=>{const before=previous.observations.find(o=>o.endpoint===n.rpc&&o.method==='eth_getBlockByNumber')?.result,after=observations.find(o=>o.endpoint===n.rpc)?.result;
  return {network:n.id,before:before?.number??null,after:after?.number??null,advancing:before?.number&&after?.number?BigInt(after.number)>BigInt(before.number)?'YES':'NO':'UNKNOWN'};
 }):undefined;
 return {schema:'framefuzz.devnet-read-survey.v1',source:'READ_ONLY_NETWORK_DISCOVERY',officialListing:'https://ethglobal.com/events/mumbai/prizes',generatedAt:new Date().toISOString(),requestCount:observations.length,observations,advancement,executionAllowlistChanged:false,broadcasts:0};
}
