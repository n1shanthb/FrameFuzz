/** Supported storage-access scenario — not arbitrary BYOC deployment.
 * Live path binds pasted source digest to this labeled interface and to
 * operator-deployed chain-1337 fixtures (or freshly operator-approved deploys).
 */
export const SUPPORTED_STORAGE_ACCESS_SCENARIO={
  id:'workshop-storage-access-validator-v1',
  label:'Supported scenario: workshop ViolatingWallet + Foreign',
  kind:'SUPPORTED_SCENARIO_NOT_ARBITRARY_BYOC',
  sourceFile:'examples/contracts/StorageAccessValidator.sol',
  contractName:'ViolatingWallet',
  companion:'Foreign',
  compiler:'solc 0.8.28',
  optimizer:{enabled:true,runs:200},
  sourceDigest:'05e4454685fa6755f0d691a382a47b8a2f941458ea075d58e823c75e2e1f6959',
  analysisId:'845042822fed6d5debf3513348fcb37d9d59915be093babeb995dcaf1adace3f',
  runtimeBytecodeTemplateHash:'0xa0b282997f1eacc54f302d398988e4cae8124b9fc8fd0ca3c2e2f21d326ec1ea',
  creationBytecodeHash:'0x1005237c323c3dfefe4f7304fe0aee2f9b342eaa10b1c330196789c25149cf13',
  capability:'LIVE_STORAGE_ACCESS_ADMISSION',
  chainId:1337,
  /** Operator-deployed fixtures from approved packet (2026-11-07). Fresh demos re-sign against these. */
  fixtures:{
    wallet:'0x6b7206fa6fc5fe541061bdedf2c6a2bbf4cf8199',
    foreign:'0x6d5bed568904290fca0b8d4e99bed2a7f9d44145',
    owner:'0x366E6203603C39Eec1e75b3be6f078911447f235',
    stakingRegistry:'0xd51c04d7a0b01124e84de152f4e56d9eecb22d2f',
    stakeWei:'12000000000000000',
    unstakeDelaySec:86400,
    deployProvenance:{
      foreignTx:'0xb1703856dfb91ff894fae18ef6b69db41a28e809f088e98fc7322fddc6f3e81c',
      walletTx:'0xa30017366a7cfcc86a1618a59d20118135617fa23e41a5c0c1fb21a52d77e744',
      stakeTx:'0xb1611eabbf4f53a60b1a98507eeb6db74186dcd5ab0b4bfdfe121a8499d03ec9',
      binding:'IMMUTABLE_SLOTS',
      notice:'Deployed under explicit packet approval. Playground live path reuses these addresses after source digest + runtime bind checks; it does not silently substitute another contract.',
    },
  },
  referenceEvidence:{
    file:'evidence/live/2026-11-07/storage-access-live.json',
    transactionHash:'0xf69e0f4b87827d8d5d295188d10e7672b2bace87e6ac8d09916758bee155e31d',
    notice:'Reference capture only. Demo video must show a NEW live prepare→run, never replay this hash as LIVE.',
  },
  workflow:['Paste or Load supported source','Analyze / select ViolatingWallet','Refresh live readiness','Prepare fresh admission experiment','Confirm bounded writes','Run Live Comparison','Save Regression locally'],
};

export function matchesSupportedScenario(analysis){
  if(!analysis)return false;
  return analysis.sourceDigest===SUPPORTED_STORAGE_ACCESS_SCENARIO.sourceDigest
    &&analysis.contractName===SUPPORTED_STORAGE_ACCESS_SCENARIO.contractName
    &&analysis.runtimeBytecodeHash===SUPPORTED_STORAGE_ACCESS_SCENARIO.runtimeBytecodeTemplateHash
    &&analysis.capabilities?.includes('LIVE_STORAGE_ACCESS_ADMISSION');
}
