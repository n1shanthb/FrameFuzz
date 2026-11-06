/** Observations must come from an executor/captured response, never model prose. */
export function classifyOutcome({expectedVerdict,observedVerdict=null,executionMode,provenance,feasibilityDecision='EXECUTABLE',prerequisitesVerified=false,infrastructureFailure=false,reproductionStatus='NOT_REQUESTED'}){
 const base={expectedVerdict,observedVerdict,executionMode,provenance,feasibilityDecision,prerequisitesVerified,oracleMatch:null,findingCandidate:false,reproductionStatus,verifiedVulnerability:false};
 if(infrastructureFailure)return {...base,observedVerdict:null,classification:'INCONCLUSIVE'};
 const deferred={INVALID:'SKIPPED_INVALID',CONDITIONAL:'BLOCKED_PRECONDITION',UNSUPPORTED:'UNSUPPORTED',DUPLICATE:'SKIPPED_DUPLICATE'};
 if(deferred[feasibilityDecision])return {...base,observedVerdict:null,classification:deferred[feasibilityDecision]};
 if(executionMode==='POLICY_PREDICTION')return {...base,observedVerdict:null,classification:'PREDICTED'};
 if(!['OFFLINE_SIGNATURE_BINDING','LIVE_ADMISSION'].includes(executionMode))return {...base,observedVerdict:null,classification:'INCONCLUSIVE'};
 if(!prerequisitesVerified||!['ACCEPT','REJECT'].includes(observedVerdict)||!['ACCEPT','REJECT'].includes(expectedVerdict))return {...base,classification:'INCONCLUSIVE'};
 const oracleMatch=expectedVerdict===observedVerdict,classification=expectedVerdict==='ACCEPT'?(oracleMatch?'PASS':'FAIL'):(oracleMatch?'XFAIL':'XPASS');
 return {...base,oracleMatch,classification,findingCandidate:!oracleMatch};
}
