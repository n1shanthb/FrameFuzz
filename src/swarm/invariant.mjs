/** Consume independent action proof; admission/outer receipt alone never establishes a weakness. */
export function classifyAuthorizationExperiment(e){
  const failure=e.failureClass;
  if(['transport','infrastructure'].includes(failure))return {verdict:failure==='transport'?'TRANSPORT_FAILURE':'INFRASTRUCTURE_FAILURE',finding:false};
  if(['nonce','funding','layout','gas'].includes(failure))return {verdict:'PRECONDITION_FAILURE',failureClass:failure,finding:false};
  if(failure==='execution')return {verdict:'FRAME_EXECUTION_FAILURE',finding:false};
  if(failure==='authorization')return {verdict:'AUTHORIZATION_REJECTED',finding:false};
  const contextual=e.ownedFixture===true&&e.signatureRetained===true&&e.targetUnchanged===true&&e.canonicalHashChanged===true&&e.originalAuthorizationVerified===true&&e.isolatedContextsVerified===true;
  const actionProof=p=>p?.source==='LIVE_EIP8141'&&p.frameStatus==='0x1'&&p.actualCaller?.toLowerCase()===p.expectedCaller?.toLowerCase()&&p.actualOperation===p.expectedOperation&&p.actualParameter===p.expectedParameter&&p.receiptHashVerified===true&&p.actionEvidenceVerified===true;
  if(!contextual||!actionProof(e.baseline))return {verdict:'INCONCLUSIVE',finding:false};
  if(e.fixture==='safe'&&e.tampered?.authorizationRejected===true&&e.tampered?.actionAbsentVerified===true&&e.tampered?.source==='LIVE_EIP8141')return {verdict:'BOUND_HOLDS',finding:false};
  if(e.fixture==='unsafe'&&actionProof(e.tampered)&&(e.tampered.actualOperation!==e.baseline.actualOperation||e.tampered.actualParameter!==e.baseline.actualParameter))return {verdict:'BINDING_VIOLATED',finding:e.independentlyReproduced===true,scope:'intentionally unsafe owned fixture only'};
  return {verdict:'INCONCLUSIVE',finding:false};
}
