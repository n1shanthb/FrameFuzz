import {readFile} from 'node:fs/promises';
import {validateRegressionCase} from './case.mjs';
const FILES=['evidence/arkiv/2026-11-06/publish.json','evidence/integrated/2026-11-06/arkiv-publish.json'];
/** Historical publication snapshots only. No current expiry assertion or replay permission. */
export async function savedCommunity({suite,ruleId,implementation,owner}={}){
  const cases=[];
  for(const file of FILES){
    const p=JSON.parse(await readFile(new URL('../../'+file,import.meta.url),'utf8')),record=validateRegressionCase(p.record);
    if(p.receipt.status!=='success'||p.receipt.transactionHash!==p.transactionHash||record.publisher.toLowerCase()!==p.publisher.toLowerCase()||p.contentDigest!==record.contentDigest)throw new Error('Saved publication integrity failed');
    if((suite&&record.suite!==suite)||(ruleId&&record.ruleId!==ruleId)||(implementation&&record.implementationVersion!==implementation)||(owner&&p.publisher.toLowerCase()!==owner.toLowerCase()))continue;
    cases.push({key:p.entityKey,owner:p.publisher,creator:p.publisher,expiresAtBlock:p.expiresAtBlock,record,
      provenance:'SAVED_HISTORICAL_PUBLICATION',verification:{schema:'VALID',digest:'VALID',creatorBinding:'HISTORICAL_RECEIPT_ONLY',expiry:'NOT_CURRENTLY_CHECKED',replayAllowed:false},
      receipt:{transactionHash:p.transactionHash,blockNumber:String(p.receipt.blockNumber)},sourceFile:file});
  }
  return {source:'SAVED_ARKIV_PUBLICATIONS — NOT A FRESH QUERY',mode:'saved',chainId:7794095,currentBlock:null,
    reader:{mode:'offline',walletAddress:null,authenticated:false},cases,rejected:[],
    discovery:{limit:2,returned:cases.length,possiblyTruncated:false,paginationSupported:false,notice:'Two committed historical publications only; current expiry/availability unknown. Inspect an already saved PREVIEW; no new import is offered.'}};
}
