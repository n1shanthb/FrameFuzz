export type Classification = 'LIVE' | 'PREVIEW' | 'MOCK';
export type PathOutcome = {
  expected:'accepted'|'rejected'|null;
  confidence:'VERIFIED'|'INFERRED'|'UNKNOWN';
  admission:'accepted'|'rejected'|'inconclusive'|'transport_failure';
  verdict:string;
  returnedHash:string|null;
  computedHash:string|null;
  receipt:{state:string;status:string|null;blockNumber:string|null};
};
export interface RegressionCase {
  schemaVersion:'framefuzz.regression.v1';caseVersion:1;
  suite:'verification-gas'|'uniswap-storage';mutationFamily:string;ruleId:string;
  implementationVersion:string;
  targetNetwork:{chainId:1337;executionCommit:string|null;sidecarVersion:string;sidecarCommit:string|null};
  seed:number;semanticParameters:Record<string,string|number|boolean>;
  originalOutcomes:{public:PathOutcome;alt:PathOutcome};
  reproduction:{schema:'framefuzz.mutation-reproduction.v1';generatorVersion:string;definition:Record<string,unknown>;definitionDigest:string;variantIndex:number;baseTemplateId:string;unsignedModel:Record<string,unknown>;setup:Record<string,unknown>};
  evidence:{classification:Classification;sha256:string;scope:'offchain-full-evidence';caseId:string};
  publisher:string;expiration:{blocks:number;expiresAtBlock:string};contentDigest:string;
  uniswap?:{protocol:'uniswap-v4';chainId:1337;poolId:string;contracts:Record<'stateView'|'poolManager',{address:string;codeHash:string}>;slot0:{sqrtPriceX96:string;tick:number;protocolFee:number;lpFee:number;initialized:boolean};paymaster:{address:string;codeHash:string;stake:{registry:string;amountWei:string;delaySeconds:string;withdrawTime:string;staked:boolean}};policies:Record<'public'|'alt',{ruleId:string;expected:string|null}>;source:{file:string;line:number};limitation:string};
}
export interface RetrievedCase {key:string;owner:string;creator:string;expiresAtBlock:string;record:RegressionCase;reader:{mode:'public-read-only';walletAddress:string|null};}

