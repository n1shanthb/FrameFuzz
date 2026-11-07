import {ExpirationTime} from '@arkiv-network/sdk';
import {addr,u64} from '@arkiv-network/sdk/schema';
import {and,eq,gt} from '@arkiv-network/sdk/query';
import {stringToBytes,hexToString} from 'viem';
import {RegressionCases,REGISTRY_SCHEMA} from './schema.mjs';
import {ARKIV_CHAIN_ID,ARKIV_RPC,arkivClients} from './client.mjs';
import {buildRegressionCase,validateRegressionCase} from './case.mjs';
import {runMutationCampaign} from '../mutations/campaign.mjs';

const HASH=/^0x[\da-f]{64}$/i,ADDRESS=/^0x[\da-f]{40}$/i;
const scalar=(value)=>typeof value==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,159}$/.test(value);
const SAFE_PREVIEW_CONFIG={chainId:1337,authorizedEndpoints:['https://altmempool.forshtat.com/rpc'],paymasters:{},paymasterCodeHashes:{}};

export function createRegistry({publicClient,walletClient=null,readerAddress=process.env.ARKIV_READER_ADDRESS??null,previewRunner=runMutationCampaign}={}){
  if(!publicClient)({publicClient}=arkivClients({readOnly:true}));
  if(readerAddress&&!ADDRESS.test(readerAddress))throw new Error('Invalid read-only reader wallet address');
  const reader={mode:'public-read-only',walletAddress:readerAddress,authenticated:false};
  async function currentBlock(){
    if(await publicClient.getChainId()!==ARKIV_CHAIN_ID)throw new Error('Arkiv registry requires Rabdi chain 7794095; never use the EIP-8141 RPC');
    return (await publicClient.getBlockTiming()).currentBlock;
  }
  function decode(row,block){
    if(!HASH.test(row.$key??'')||!ADDRESS.test(row.$owner??'')||!ADDRESS.test(row.$creator??''))throw new Error('Invalid Arkiv entity identity/ownership');
    if(BigInt(row.$expiresAt)<=block)throw new Error('Registry entity expired; it cannot be offered for replay');
    const payload=row.record?.value;
    if(typeof payload!=='string'||payload.length>65538)throw new Error('Invalid or oversized regression payload');
    const record=validateRegressionCase(JSON.parse(hexToString(payload)));
    if(record.publisher.toLowerCase()!==row.$creator.toLowerCase())throw new Error('Publisher wallet does not match immutable Arkiv creator');
    for(const [field,value]of Object.entries({suite:record.suite,family:record.mutationFamily,ruleId:record.ruleId,implementation:record.implementationVersion,classification:record.evidence.classification,contentDigest:record.contentDigest}))if(row[field]?.value!==value)throw new Error(`Arkiv indexed ${field} differs from content`);
    if(Number(row.caseVersion?.value)!==1||row.publisher?.value?.toLowerCase()!==record.publisher.toLowerCase()||String(row.expiresAtBlock?.value)!==record.expiration.expiresAtBlock||String(row.$expiresAt)!==record.expiration.expiresAtBlock)throw new Error('Arkiv version/publisher/expiration mismatch');
    return {key:row.$key,owner:row.$owner,creator:row.$creator,expiresAtBlock:String(row.$expiresAt),record,reader,
      provenance:'FRESH_ARKIV_READ',verification:{schema:'VALID',digest:'VALID',creatorBinding:'VALID',expiry:'ACTIVE_AT_BLOCK_'+String(block),replayAllowed:true}};
  }
  return {
    reader,
    async publish({report,caseIndex=0,expirationBlocks=43200,evidenceDigest,submit=false}){
      if(!submit)throw new Error('Arkiv publish requires explicit --submit authorization');
      if(!walletClient?.account?.address)throw new Error('Set ARKIV_PRIVATE_KEY to a funded Rabdi-only writer wallet');
      if(walletClient.chain?.id!==ARKIV_CHAIN_ID)throw new Error('Writer is not configured for Rabdi chain 7794095');
      const block=await currentBlock();
      const record=buildRegressionCase({report,caseIndex,publisher:walletClient.account.address,expirationBlocks,expiresAtBlock:block+BigInt(expirationBlocks),evidenceDigest});
      const values={caseVersion:u64(1n),suite:record.suite,family:record.mutationFamily,ruleId:record.ruleId,implementation:record.implementationVersion,publisher:addr(record.publisher),
        classification:record.evidence.classification,contentDigest:record.contentDigest,expiresAtBlock:u64(BigInt(record.expiration.expiresAtBlock)),record:stringToBytes(JSON.stringify(record))};
      const created=await walletClient.createEntity(RegressionCases,values,{expiration:ExpirationTime.atBlock(BigInt(record.expiration.expiresAtBlock)),flags:{readonly:true,permissionlessExtension:false}});
      const receipt=await publicClient.getTransactionReceipt({hash:created.txHash});
      if(receipt.status!=='success'||receipt.transactionHash.toLowerCase()!==created.txHash.toLowerCase()||String(created.expiresAt)!==record.expiration.expiresAtBlock)throw new Error('Arkiv creation receipt/expiry did not validate');
      return {registrySchema:REGISTRY_SCHEMA,chainId:ARKIV_CHAIN_ID,rpc:ARKIV_RPC,entityKey:created.entityKey,transactionHash:created.txHash,expiresAtBlock:String(created.expiresAt),publisher:record.publisher,contentDigest:record.contentDigest,record,receipt};
    },
    async query({suite,ruleId,implementation,owner,classification,limit=20}={}){
      if(!Number.isSafeInteger(limit)||limit<1||limit>20)throw new Error('Registry query limit must be 1–20');
      const block=await currentBlock(),conditions=[gt('$expiresAt',u64(block))];
      for(const [field,value]of Object.entries({suite,ruleId,implementation,classification}))if(value){if(!scalar(value))throw new Error(`Invalid ${field} filter`);conditions.push(eq(field,value));}
      if(owner&&!ADDRESS.test(owner))throw new Error('Invalid owner filter');
      let query=publicClient.select().from(RegressionCases).where(and(...conditions)).limit(limit);
      if(owner)query=query.ownedBy(owner);
      const result=await query.fetch();
      const cases=[],rejected=[];for(const row of result.entities){try{cases.push(decode(row,block));}catch(error){rejected.push({key:row.$key??null,reason:error.message});}}
      return {source:'ARKIV_RABDI',chainId:ARKIV_CHAIN_ID,rpc:ARKIV_RPC,reader,currentBlock:String(block),query:query.toString(),discovery:{limit,returned:result.entities.length,possiblyTruncated:result.entities.length===limit,paginationSupported:false,notice:'Bounded discovery only; refine suite, rule, implementation or owner filters. No completeness guarantee.'},cases,rejected};
    },
    async fetch(entityKey){
      if(!HASH.test(entityKey))throw new Error('Arkiv entity key must be 32-byte hex');
      const block=await currentBlock();
      return decode(await publicClient.getEntity(entityKey,RegressionCases),block);
    },
    async importPreview(entityKey){
      if(!HASH.test(entityKey))throw new Error('Arkiv entity key must be 32-byte hex');
      // Re-fetch on every selection: expiration, ownership and digest are checked anew.
      const block=await currentBlock(),row=await publicClient.getEntity(entityKey,RegressionCases),retrieved=decode(row,block);
      const preview=await previewRunner({definition:retrieved.record.reproduction.definition,variant:retrieved.record.reproduction.variantIndex,config:SAFE_PREVIEW_CONFIG,preview:true,submit:false});
      if(preview.submissions!==0)throw new Error('Community import invariant violated: preview attempted submission');
      preview.source='PREVIEW_COMMUNITY — UNTRUSTED, NO BROADCAST';
      for(const result of preview.results)result.reproduction.cli=`node bin/framefuzz.mjs arkiv import --key ${retrieved.key}`;
      preview.communityOrigin={chainId:ARKIV_CHAIN_ID,entityKey:retrieved.key,publisher:retrieved.record.publisher,owner:retrieved.owner,creator:retrieved.creator,expiresAtBlock:retrieved.expiresAtBlock,contentDigest:retrieved.record.contentDigest,
        originalEvidenceClassification:retrieved.record.evidence.classification,originalOutcomes:retrieved.record.originalOutcomes,
        protocolMetadata:retrieved.record.uniswap??null,
        notice:'Original outcomes are publisher claims. This imported run is a new unsigned preview, not a live reproduction.'};
      return {retrieved,preview};
    },
  };
}
