// TEST DOUBLE ONLY: hex-encoded JSON is NOT an Ethereum transaction/signature.
// It is accepted exclusively by examples/mock-demo.mjs's in-process fake gateway.
export default async function () {
  let account = 0;
  return {
    id: 'mock-json-transport-only', mode: 'MOCK',
    accountFor: async () => ({ sender: `0x${(++account).toString(16).padStart(40, '0')}` }),
    setup: async () => {},
    getNonce: async () => 0,
    sign: async ({ sender, nonce, model }) => ({ raw: `0x${Buffer.from(JSON.stringify({ sender, nonce, model })).toString('hex')}` }),
  };
}
