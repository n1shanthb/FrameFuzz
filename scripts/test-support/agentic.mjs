export function candidate(context,{id='auth-1',operation=2,parameter=10,...rest}={}){
 return {id,suite:'frame-authorization',targetFunction:'record(uint256,uint256)',contractRole:'SENDER_VALIDATOR',sourceDigest:context.sourceDigests.authorization,profile:context.profile,
  originalInput:{operation:1,parameter:10,verificationGasLimit:0},mutatedInput:{operation,parameter,verificationGasLimit:0},ruleId:'OWNER_INTENT_BINDING',expectedVerdict:{unsafe:'ACCEPT',safe:'REJECT'},requiredPreconditions:['SOURCE_IDENTITY','KNOWN_ACCOUNTS'],verificationMethod:'OFFLINE_SIGNATURE_BINDING',intentionalNegative:true,hypothesis:'Retained authorization commits to target but omits action calldata in unsafe fixture',evidenceNeeded:'Actual ECDSA recovery for both fixtures',boundaryReason:'Negative control should reject changed calldata',...rest};
}
export const modelResponse=value=>new Response(JSON.stringify({id:'mock-agentic',model:'mock-model',usage:{total_tokens:200,cost:0.001},choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}]}));
export function roleTransport({invalid=false,wrongValidator=false,inspect=()=>{}}={}){
 return async(_,request)=>{
  const body=JSON.parse(request.body),role=body.response_format.json_schema.name.replace('framefuzz_',''),context=JSON.parse(body.messages[1].content).untrusted;inspect(role,context,body);
  if(role==='scout')return modelResponse({role:'SENDER_VALIDATOR',factIds:['unsafe-binding','safe-binding','record-abi'],unknownPrerequisites:['No deployed action execution evidence'],summary:'Source shows partial and canonical commitments'});
  if(role==='mutation')return modelResponse({candidates:[candidate(context,{targetFunction:invalid?'withdraw(uint256)':'record(uint256,uint256)'}),candidate(context,{id:'auth-2',operation:1,parameter:20})]});
  if(role==='validator')return modelResponse({decisions:context.proposals.map(p=>({id:p.id,decision:wrongValidator?'EXECUTABLE':p.targetFunction==='withdraw(uint256)'?'INVALID':'EXECUTABLE',factIds:['record-abi','unsafe-binding'],reason:'Actual record ABI and pinned source define the supported path'}))});
  if(role==='mutation_repair')return modelResponse({candidate:candidate(context,{id:context.original.id,operation:3,parameter:10}),feedbackAddressed:'Changed the impossible function to the actual compiled record ABI and a new operation'});
  if(role==='critic')return modelResponse({assessment:'Actual local recovery supports the binding split; no runtime execution is proven',concerns:['Shared codec and no EVM action evidence'],findingSupported:false,reproduceIds:['auth-1']});
  throw Error('Unexpected model role');
 };
}
