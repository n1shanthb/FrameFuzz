import {createHash} from 'node:crypto';
import {encodeFunctionData} from 'viem';
export const FRAME_MUTATION_VERSION='framefuzz.semantic.v2';
export const ACTION_ABI=[{type:'function',name:'record',inputs:[{name:'operation',type:'uint256'},{name:'parameter',type:'uint256'}],outputs:[],stateMutability:'nonpayable'}];
export const frameDigest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function frameMutationDefinition({seed=42,operation=2,parameter=999}={}){
  for(const n of [seed,operation,parameter])if(!Number.isSafeInteger(n)||n<0||n>4294967295)throw new Error('Bounded unsigned integer required');
  if(operation===1&&parameter===10)throw new Error('Mutation must change authorized action calldata');
  return {version:FRAME_MUTATION_VERSION,suite:'frame-authorization',seed,
    authorizedAction:{operation:1,parameter:10},mutation:{type:'replace-action-calldata',frameIndex:2,operation,parameter},
    invariants:{retainTarget:true,retainOwnerAuthorization:true,retainNonce:true,frameCount:3}};
}
export function generateFrameMutation(definition){
  const expected=frameMutationDefinition({seed:definition?.seed,operation:definition?.mutation?.operation,parameter:definition?.mutation?.parameter});
  if(JSON.stringify(expected)!==JSON.stringify(definition))throw new Error('Unsupported or altered v2 frame definition');
  const data=action=>encodeFunctionData({abi:ACTION_ABI,functionName:'record',args:[BigInt(action.operation),BigInt(action.parameter)]});
  return {schema:'framefuzz.frame-mutation.v2',definition:structuredClone(definition),definitionDigest:frameDigest(definition),
    authorized:{...definition.authorizedAction,data:data(definition.authorizedAction)},
    tampered:{operation:definition.mutation.operation,parameter:definition.mutation.parameter,data:data(definition.mutation)},
    targetUnchanged:true,witnessPolicy:'Reuse the original authorization for A; never sign B'};
}
export function replayFrameMutation(descriptor){
  const regenerated=generateFrameMutation(descriptor.definition);
  if(JSON.stringify(regenerated)!==JSON.stringify(descriptor))throw new Error('Frame descriptor integrity mismatch');return regenerated;
}
