import {createHash} from 'node:crypto';
import {rpc} from '../rpc.mjs';

export const EF_CHAIN_ID=1337;
export const EF_GATEWAY='https://altmempoolgateway.forshtat.com/rpc';
export const EF_SHARED_GENESIS='0x5544596212F91984C986A919C8026DF0576816f9';
export const FRAMEFUZZ_SENDER='0x366E6203603C39Eec1e75b3be6f078911447f235';
export const FUNDING_VALUE_WEI=500000000000000n;
export const FUNDING_GAS_LIMIT=250000n;
export const FUNDING_GAS_PRICE_WEI=2000000n;
const stable=value=>Array.isArray(value)?`[${value.map(stable).join(',')}]`:value&&typeof value==='object'?`{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${stable(value[k])}`).join(',')}}`:JSON.stringify(value);
const digest=value=>createHash('sha256').update(stable(value)).digest('hex');

/** Read-only resolution. It never accepts a private key or a send-capable method. */
export async function prepareEfFundingPacket({rpcFn=rpc,source=EF_SHARED_GENESIS,sender=FRAMEFUZZ_SENDER}={}){
 const allowed=new Set(['eth_chainId','web3_clientVersion','eth_blockNumber','eth_getBalance','eth_getTransactionCount','eth_getCode','eth_gasPrice','eth_estimateGas','skandha_explorer_info']);
 const read=(method,params=[])=>{if(!allowed.has(method))throw Error('EF funding preflight is read-only');return rpcFn(EF_GATEWAY,method,params);};
 const valueHex='0x'+FUNDING_VALUE_WEI.toString(16);
 const [chain,client,head,sourceBalance,latestNonce,pendingNonce,sourceCode,senderBalance,senderNonce,senderCode,gasPrice,estimate,explorer]=await Promise.all([
  read('eth_chainId'),read('web3_clientVersion'),read('eth_blockNumber'),read('eth_getBalance',[source,'latest']),
  read('eth_getTransactionCount',[source,'latest']),read('eth_getTransactionCount',[source,'pending']),read('eth_getCode',[source,'latest']),
  read('eth_getBalance',[sender,'latest']),read('eth_getTransactionCount',[sender,'pending']),read('eth_getCode',[sender,'latest']),
  read('eth_gasPrice'),read('eth_estimateGas',[{from:source,to:sender,value:valueHex}]),read('skandha_explorer_info')]);
 if(Number(BigInt(chain))!==EF_CHAIN_ID)throw Error('EF chain mismatch');
 if(sourceCode!=='0x'||senderCode!=='0x')throw Error('Funding source and sender must remain code-empty EOAs');
 if(BigInt(estimate)>FUNDING_GAS_LIMIT)throw Error('Funding gas estimate exceeds the workshop cap');
 if(BigInt(gasPrice)>FUNDING_GAS_PRICE_WEI)throw Error('Current gas price exceeds the workshop cap');
 const feeCap=FUNDING_GAS_LIMIT*FUNDING_GAS_PRICE_WEI,totalDebit=FUNDING_VALUE_WEI+feeCap;
 if(BigInt(sourceBalance)<totalDebit)throw Error('Official shared funding source balance is insufficient');
 const intent={chainId:EF_CHAIN_ID,type:'legacy',from:source,to:sender,nonce:String(BigInt(pendingNonce)),valueWei:String(FUNDING_VALUE_WEI),data:'0x',gasLimit:String(FUNDING_GAS_LIMIT),gasPriceWei:String(FUNDING_GAS_PRICE_WEI),maximumGasFeeWei:String(feeCap),maximumSourceDebitWei:String(totalDebit)};
 const blockers=[];
 if(BigInt(latestNonce)!==BigInt(pendingNonce))blockers.push('Shared source has pending transactions; refresh nonce immediately before signing');
 if(BigInt(senderBalance)!==0n||BigInt(senderNonce)!==0n)blockers.push('Prepared frame candidate sender state changed; re-sign after funding confirmation');
 blockers.push('Exact transfer has not received separate write authorization');
 return {schema:'framefuzz.ef-funding-packet.v1',classification:'AWAITING_EXPLICIT_APPROVAL',observedAt:new Date().toISOString(),endpoint:EF_GATEWAY,
  network:{chainId:EF_CHAIN_ID,clientVersion:client,blockNumber:head,currentGasPriceWei:String(BigInt(gasPrice)),faucetEnabled:explorer?.faucetEnabled===true},
  source:{address:source,provenance:'Official public workshop genesis account; shared and race-prone',balanceWei:String(BigInt(sourceBalance)),latestNonce:String(BigInt(latestNonce)),pendingNonce:String(BigInt(pendingNonce)),code:sourceCode},
  sender:{address:sender,balanceWei:String(BigInt(senderBalance)),pendingNonce:String(BigInt(senderNonce)),code:senderCode},gasEstimate:String(BigInt(estimate)),intent,
  approvalDigest:digest(intent),faucetAlternative:{method:'skandha_explorer_faucet',fixedValueWei:'1000000000000000000',suitableForExactAmount:false,reason:'Official faucet always transfers 1 test ETH, not 0.0005'},
  candidateRevalidation:{status:BigInt(senderBalance)>=FUNDING_VALUE_WEI&&BigInt(senderNonce)===0n?'READY_TO_REVALIDATE':'AWAITING_FUNDING',requiredAfterReceipt:['receipt status 0x1 and matching transfer hash','sender balance >= 0.0005 test ETH','sender code remains 0x','sender pending nonce remains 0','chain/client/profile unchanged','prepared frame hash and signature recover unchanged']},
  blockers,writes:0,broadcasts:0};
}
