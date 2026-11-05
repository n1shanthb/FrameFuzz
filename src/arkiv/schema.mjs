import {defineSchema,str,u64,addr,bytes} from '@arkiv-network/sdk/schema';

export const REGISTRY_SCHEMA='framefuzz.regression.v1';
export const RegressionCases=defineSchema(REGISTRY_SCHEMA,{
  caseVersion:u64(),suite:str().indexed(),family:str().indexed(),ruleId:str().indexed(),
  implementation:str().indexed(),publisher:addr().indexed(),classification:str().indexed(),
  contentDigest:str().indexed(),expiresAtBlock:u64().indexed(),record:bytes(),
});
