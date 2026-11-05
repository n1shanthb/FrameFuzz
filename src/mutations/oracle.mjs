import { compareAdmission } from '../verdict.mjs';

export function expectation(model, setup, pathId, rules) {
  const provenance = rules?.provenance;
  const verified = provenance?.confidence === 'VERIFIED' && provenance?.evidence?.length > 0 && rules?.version;
  const common = { ruleId: model.poolRead ? 'STORAGE_ACCESS' : 'MAX_VERIFY_GAS', modelVersion: rules?.version ?? null,
    confidence: verified ? 'VERIFIED' : 'UNKNOWN', source: provenance ?? null };
  if (!verified) return { ...common, expected: null, reason: 'Missing verified rule-model provenance; no policy finding can be inferred' };
  const gas = rules.gas;
  if (!gas || ![gas.senderExecution,gas.signatureCost,gas.maxTotal,gas.knownSufficientPayer,gas.observedPayerUsed].every(Number.isSafeInteger)) return { ...common, confidence:'UNKNOWN',expected:null,reason:'Incomplete verification-gas component model' };
  const total = model.verificationGasLimit + gas.senderExecution + gas.signatureCost;
  const components = { payer:model.verificationGasLimit,sender:gas.senderExecution,signature:gas.signatureCost,total,cap:gas.maxTotal };
  if (!Number.isSafeInteger(total) || model.verificationGasLimit < gas.observedPayerUsed) return {
    ...common,expected:null,confidence:'UNKNOWN',components,precondition:'INSUFFICIENT_VALIDATION_GAS',
    reason:`Payer gas is below observed execution usage ${gas.observedPayerUsed}; admission-cap reasoning cannot establish validation success` };
  if (total > gas.maxTotal) return { ...common,ruleId:'MAX_VERIFY_GAS',expected:'rejected',expectedRule:'MAX_VERIFY_GAS',components,reason:`${total} exceeds total verification budget ${gas.maxTotal}` };
  if (model.verificationGasLimit < gas.knownSufficientPayer) return { ...common,expected:'accepted',confidence:'INFERRED',components,
    reason:'Below the cap but outside the evidenced sufficient-gas interval; acceptance is inferred and a mismatch is inconclusive' };
  if (model.poolRead) {
    const policy = rules.storage?.[pathId];
    if (!policy) return { ...common,confidence:'UNKNOWN',expected:null,components,reason:'No storage policy for this path' };
    const allowed = setup.staked ? policy.staked : policy.unstaked;
    if (typeof allowed !== 'boolean') return { ...common,confidence:'UNKNOWN',expected:null,components,reason:'Missing stake-specific storage policy' };
    return { ...common,components,expected:allowed?'accepted':'rejected',expectedRule:allowed?null:policy.rejection,
      prerequisite:{poolRead:true,staked:setup.staked,paymasterKind:setup.configuration.kind},
      reason:`${pathId} ${setup.staked?'staked':'unstaked'} external Uniswap storage read is ${allowed?'allowed':'disallowed'} by the evidenced policy` };
  }
  return { ...common,expected:'accepted',components,reason:`Budget ${total} <= ${gas.maxTotal}, payer gas >= evidenced sufficient ${gas.knownSufficientPayer}, and no external pool read; setup must still pass` };
}

export function compareMutation(oracle, observed) {
  if (observed?.status === 'transport_failure') return {verdict:'TRANSPORT_FAILURE',reason:observed.message};
  const precondition = oracle?.precondition || observed?.errorClass === 'adapter_setup' ||
    ['malformed_transaction','nonce_or_duplicate','funding','rpc_method','rpc_error','validation_gas'].includes(observed?.errorClass) ||
    observed?.status === 'rejected' && /ran out of gas|out of gas|insufficient funds|insufficient balance|nonce too|already known|invalid signature/i.test(observed.message ?? '');
  if (precondition) return {verdict:'PRECONDITION_FAILURE',reason:oracle?.precondition ?? observed?.message ?? 'Setup or transaction precondition failed'};
  if (!oracle?.expected || oracle.confidence === 'UNKNOWN') return {verdict:'INCONCLUSIVE',reason:oracle?.reason ?? 'Unknown expected policy'};
  const comparison=compareAdmission(oracle.expected,observed,oracle.expectedRule);
  if (oracle.confidence !== 'VERIFIED' && comparison.verdict.startsWith('UNEXPECTED')) return {verdict:'INCONCLUSIVE',reason:'Observed deviation from an inferred expectation; not a verified rule discrepancy'};
  return comparison.verdict === 'UNEXPECTED_RULE' ? {...comparison,verdict:'UNEXPECTED_RULE_CLASS'} : comparison;
}
