export const EVIDENCE_CLASSES=Object.freeze(['HISTORICAL_LIVE','CURRENT_LIVE','OFFLINE_EXECUTED','POLICY_PREDICTION','SIMULATION','UNVERIFIED','INFRASTRUCTURE_FAILURE']);
/** Classify captured evidence for reading/export. Recency never implies current verification. */
export function savedEvidenceClass(report){
 const source=String(report?.source??'');
 if(/MOCK|SIMULATED|SYNTHETIC/.test(source))return 'SIMULATION';
 if(/PREVIEW/.test(source))return 'POLICY_PREDICTION';
 if(source.startsWith('LIVE_RPC_SUBMISSION'))return 'HISTORICAL_LIVE';
 if(report?.executionClass?.startsWith('OFFLINE_SIGNATURE_BINDING'))return 'OFFLINE_EXECUTED';
 return 'UNVERIFIED';
}
export function evidenceView(report){
 const evidenceClassification=savedEvidenceClass(report);
 return {...report,evidenceClassification,...(Array.isArray(report.results)?{results:report.results.map(c=>({...c,paths:c.paths.map(p=>({...p,
  evidenceClassification:p.observed?.status==='transport_failure'||p.observed?.errorClass==='gateway_infrastructure'?'INFRASTRUCTURE_FAILURE':evidenceClassification,
  observationScope:evidenceClassification==='POLICY_PREDICTION'?'No observed admission; unsigned expectations only':'Captured observation; inspect source, receipt and timestamps separately'}))}))}:{})};
}
