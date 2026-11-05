// Real unsigned field-mutation generator ADAPTER TEMPLATE.
// Replace 'signFrameTransaction' with your existing workshop signing routine.
// This file is intentionally not under examples/cases because it is not runnable yet.
import { numericBoundaryCases } from '../../src/mutations.mjs';

export async function createCases(signFrameTransaction) {
  const baseline = { verificationGasLimit: 100000 };
  return numericBoundaryCases({
    id: 'verification-gas', template: baseline,
    field: 'verificationGasLimit', boundary: 100000,
    sign: async model => signFrameTransaction(model),
    // This is a STUB until the exact EIP and sidecar rule under test is read.
    // Do NOT mark these speculative expectations as verified findings.
    expectedFor: async model => model.verificationGasLimit <= 100000 ? 'accepted' : 'rejected',
  });
}
