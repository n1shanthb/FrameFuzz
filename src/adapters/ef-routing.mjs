export const EF_CHAIN_ID=1337;
export const EF_CANONICAL_ENDPOINT='https://altmempool.forshtat.com';
export const EF_ALTERNATIVE_ENDPOINT='https://altmempool.forshtat.com/rpc/';

export function classifyEfEndpoint({chainId,clientVersion,skandhaInfo=null,skandhaConfig=null}={}){
 const chain=Number(typeof chainId==='string'&&chainId.startsWith('0x')?BigInt(chainId):chainId);
 if(chain!==EF_CHAIN_ID)return {role:'INVALID',reason:`Expected chain ${EF_CHAIN_ID}, observed ${chain}`};
 const client=String(clientVersion??'');
 if(/^ethrex\//i.test(client))return {role:'CANONICAL_EXECUTION',clientFamily:'ethrex',submissionMethod:'eth_sendRawTransaction',parameterShape:'SIGNED_TYPE_0X06_BYTES'};
 if(/^skandha\//i.test(client)){
  const infoChain=skandhaInfo?.chainId??skandhaConfig?.chainId;
  if(infoChain!==undefined&&Number(infoChain)!==EF_CHAIN_ID)return {role:'INVALID',reason:'Skandha capability chain mismatch'};
  return {role:'ALTERNATIVE_SIDECAR',clientFamily:'skandha',submissionMethod:'eth_sendFrameTransaction',parameterShape:'STRUCTURED_SIGNED_FRAME',healthy:Boolean(skandhaInfo&&skandhaConfig)};
 }
 return {role:'UNKNOWN',reason:`Unsupported client identity ${client.slice(0,80)}`};
}

export function assertEfRouting({canonical,alternative}){
 const canonicalRole=classifyEfEndpoint(canonical),alternativeRole=classifyEfEndpoint(alternative);
 if(canonicalRole.role!=='CANONICAL_EXECUTION')throw Error(`Canonical endpoint identity mismatch: ${canonicalRole.reason??canonicalRole.role}`);
 if(alternativeRole.role!=='ALTERNATIVE_SIDECAR')throw Error(`Alternative endpoint identity mismatch: ${alternativeRole.reason??alternativeRole.role}`);
 return {canonical:canonicalRole,alternative:alternativeRole};
}
