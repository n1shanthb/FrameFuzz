import {privateKeyToAccount,generatePrivateKey} from 'viem/accounts';
import {compileOwnedFixtures} from './compile.mjs';
import {assertSwarmEnabled} from './gate.mjs';
import {frameMutationDefinition,generateFrameMutation,replayFrameMutation,frameDigest} from '../mutations/frames.mjs';
import {prepareAuthorizationPair} from '../adapters/sender-validator.mjs';
import {validateHypothesis} from './hypothesis.mjs';
export const EXECUTION_CLASS='OFFLINE_SIGNATURE_BINDING';
const addr=n=>'0x'+n.toString(16).padStart(40,'0');
export async function executeMutation(mutation){
 assertSwarmEnabled();replayFrameMutation(mutation);const ownerAccount=privateKeyToAccount(generatePrivateKey()),results={};
 for(const [index,fixture]of ['unsafe','safe'].entries()){
  const p=await prepareAuthorizationPair({fixture,ownerAccount,sender:addr(101+index),payer:addr(200),target:addr(300),nonce:0,mutation});
  results[fixture]={...p.invariants,authorizedComputedHash:p.authorized.computedHash,tamperedComputedHash:p.tampered.computedHash};
 }
 const semanticProperties=Object.fromEntries(Object.entries(results).map(([k,v])=>[k,Object.fromEntries(Object.entries(v).filter(([n])=>!n.endsWith('ComputedHash')))]));
 const split=results.unsafe.authorizedOwnerRecovered&&results.safe.authorizedOwnerRecovered&&results.unsafe.tamperedOwnerRecovered&&!results.safe.tamperedOwnerRecovered&&Object.values(results).every(x=>x.sameWitness&&x.sameTarget&&x.canonicalHashChanged);
 return {executionClass:EXECUTION_CLASS,semanticProperties,results,verdict:split?'OFFLINE_BINDING_DIFFERENTIAL_OBSERVED':'OFFLINE_DIFFERENTIAL_NOT_OBSERVED',finding:false,evmExecuted:false,admissionVerified:false,actionExecutionVerified:false,broadcasts:0};
}
export async function executeHypothesis(proposal){
 const h=validateHypothesis(proposal);if(h.suite!=='frame-authorization')throw new Error('Unavailable experiment backend');
 const compilation=await compileOwnedFixtures(),mutation=generateFrameMutation(frameMutationDefinition({operation:h.operation,parameter:h.parameter})),observation=await executeMutation(mutation);
 const descriptor={schema:'framefuzz.offline-regression.v1',executionClass:EXECUTION_CLASS,mutation,compiler:compilation.compiler,compilerInputDigest:compilation.inputDigest,sourceDigests:compilation.sourceDigests,semanticProperties:observation.semanticProperties};
 descriptor.contentDigest=frameDigest(descriptor);
 const predicted=(fixture)=>h[fixture+'Prediction']==='OWNER_RECOVERED';
 return {mutationValues:{operation:h.operation,parameter:h.parameter},calldata:mutation.tampered.data,observation,predictionSupported:{unsafe:predicted('unsafe')===observation.results.unsafe.tamperedOwnerRecovered,safe:predicted('safe')===observation.results.safe.tamperedOwnerRecovered},descriptor};
}
export async function replayRegression(descriptor){
 const allowed=['schema','executionClass','mutation','compiler','compilerInputDigest','sourceDigests','semanticProperties','contentDigest'];
 if(!descriptor||Object.keys(descriptor).some(k=>!allowed.includes(k)))throw new Error('Invalid regression descriptor fields');
 const {contentDigest,...body}=descriptor;if(frameDigest(body)!==contentDigest||descriptor.schema!=='framefuzz.offline-regression.v1'||descriptor.executionClass!==EXECUTION_CLASS)throw new Error('Regression integrity/schema mismatch');
 const compilation=await compileOwnedFixtures();
 if(compilation.compiler!==descriptor.compiler||compilation.inputDigest!==descriptor.compilerInputDigest||frameDigest(compilation.sourceDigests)!==frameDigest(descriptor.sourceDigests))throw new Error('Owned source/compiler provenance mismatch');
 const observation=await executeMutation(descriptor.mutation);
 if(frameDigest(observation.semanticProperties)!==frameDigest(descriptor.semanticProperties))throw new Error('Independent semantic properties differ');
 return {schema:'framefuzz.independent-replay.v1',pid:process.pid,descriptorDigest:contentDigest,executionClass:EXECUTION_CLASS,sourceHashesVerified:true,equivalentSemanticProperties:true,observation,liveVerified:false,finding:false};
}
