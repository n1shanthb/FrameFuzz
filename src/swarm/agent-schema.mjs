import {boundedJSON} from '../analysis/model.mjs';
const text={type:'string',minLength:1,maxLength:1200},id={type:'string',minLength:1,maxLength:100};
const choice=(...values)=>({type:'string',enum:values});
const integer=max=>({type:'integer',minimum:0,maximum:max});
const object=properties=>({type:'object',additionalProperties:false,required:Object.keys(properties),properties});
const list=(items,minItems=0,maxItems=8)=>({type:'array',items,minItems,maxItems});
export const INPUT=object({operation:integer(65535),parameter:integer(1000000),verificationGasLimit:integer(1000000)});
export const CANDIDATE=object({id,suite:choice('frame-authorization','verification-gas','uniswap-storage'),targetFunction:id,contractRole:choice('SENDER_VALIDATOR','PAYMASTER','EXECUTION_TARGET','UNKNOWN'),sourceDigest:{type:'string',minLength:64,maxLength:64},profile:id,
 originalInput:INPUT,mutatedInput:INPUT,ruleId:id,expectedVerdict:object({unsafe:choice('ACCEPT','REJECT','UNKNOWN'),safe:choice('ACCEPT','REJECT','UNKNOWN')}),
 requiredPreconditions:list(choice('SOURCE_IDENTITY','KNOWN_ACCOUNTS','FRESH_NONCE','FUNDED_PAYER','DEPLOYED_CODE','STAKE','COMPATIBLE_RUNTIME')),verificationMethod:choice('OFFLINE_SIGNATURE_BINDING','POLICY_PREDICTION','LIVE_ADMISSION','EVM_ACTION'),
 intentionalNegative:{type:'boolean'},hypothesis:text,evidenceNeeded:text,boundaryReason:text});
export const SCOUT_SCHEMA=object({role:choice('SENDER_VALIDATOR','PAYMASTER','EXECUTION_TARGET','UNKNOWN'),factIds:list(id,1,16),unknownPrerequisites:list(text),summary:text});
export const MUTATION_SCHEMA=object({candidates:list(CANDIDATE,1,2)});
export const REPAIR_SCHEMA=object({candidate:CANDIDATE,feedbackAddressed:text});
export const VALIDATOR_SCHEMA=object({decisions:list(object({id,decision:choice('EXECUTABLE','CONDITIONAL','INVALID','DUPLICATE','UNSUPPORTED'),factIds:list(id,1,16),reason:text}),1,2)});
export const CRITIC_SCHEMA=object({assessment:text,concerns:list(text),findingSupported:{type:'boolean'},reproduceIds:list(id,0,1)});
// Small strict validator for our fixed schemas, shared with the real provider response path.
export function validateStructured(value,schema){
 boundedJSON(value);
 const check=(v,s,path)=>{
  if(s.type==='object'){if(!v||Array.isArray(v)||typeof v!=='object'||Object.keys(v).some(k=>!Object.hasOwn(s.properties,k))||s.required.some(k=>!Object.hasOwn(v,k)))throw Error('Invalid structured object at '+path);for(const [k,p]of Object.entries(s.properties))check(v[k],p,path+'.'+k);}
  else if(s.type==='array'){if(!Array.isArray(v)||v.length<s.minItems||v.length>s.maxItems)throw Error('Invalid structured array at '+path);v.forEach((x,i)=>check(x,s.items,path+'['+i+']'));}
  else if(s.type==='string'){if(typeof v!=='string'||v.length<(s.minLength??0)||v.length>(s.maxLength??600)||s.enum&&!s.enum.includes(v))throw Error('Invalid structured string at '+path+' (length '+(typeof v==='string'?v.length:'non-string')+')');}
  else if(s.type==='integer'){if(!Number.isSafeInteger(v)||v<s.minimum||v>s.maximum)throw Error('Invalid structured integer at '+path);}
  else if(s.type==='boolean'&&typeof v!=='boolean')throw Error('Invalid structured boolean at '+path);
 };check(value,schema,'response');return structuredClone(value);
}
