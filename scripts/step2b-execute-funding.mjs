import {createPublicClient,http} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {EF_GATEWAY,EF_SHARED_GENESIS,FRAMEFUZZ_SENDER,FUNDING_VALUE_WEI,FUNDING_GAS_LIMIT} from '../src/adapters/ef-funding.mjs';

const GAS_PRICE_CEILING=5_000_000n;
// Historical one-shot executor: the pinned source nonce and zero-state recipient guards make it non-repeatable.
const key=process.env.FRAMEFUZZ_EF_FUNDING_KEY;
if(!key)throw Error('FRAMEFUZZ_EF_FUNDING_KEY is required');
const account=privateKeyToAccount(key.startsWith('0x')?key:`0x${key}`);
if(account.address.toLowerCase()!==EF_SHARED_GENESIS.toLowerCase())throw Error('Funding key does not derive the official shared source');
const client=createPublicClient({transport:http(EF_GATEWAY)});
const [chainId,gasPrice,latestNonce,pendingNonce,sourceBalance,senderBalance,senderNonce,senderCode]=await Promise.all([
 client.getChainId(),client.getGasPrice(),client.getTransactionCount({address:account.address,blockTag:'latest'}),client.getTransactionCount({address:account.address,blockTag:'pending'}),client.getBalance({address:account.address}),client.getBalance({address:FRAMEFUZZ_SENDER}),client.getTransactionCount({address:FRAMEFUZZ_SENDER,blockTag:'pending'}),client.getCode({address:FRAMEFUZZ_SENDER}),
]);
if(chainId!==1337)throw Error(`Wrong chain ${chainId}`);
if(latestNonce!==146||pendingNonce!==146)throw Error(`Source nonce changed: ${latestNonce}/${pendingNonce}`);
if(senderBalance!==0n||senderNonce!==0||senderCode!==undefined)throw Error('Recipient state changed');
if(gasPrice>GAS_PRICE_CEILING)throw Error(`Gas price ${gasPrice} exceeds ${GAS_PRICE_CEILING}`);
const maximumDebit=FUNDING_VALUE_WEI+FUNDING_GAS_LIMIT*gasPrice;
if(sourceBalance<maximumDebit)throw Error('Funding source balance is insufficient');
const serialized=await account.signTransaction({chainId,to:FRAMEFUZZ_SENDER,value:FUNDING_VALUE_WEI,nonce:pendingNonce,gas:FUNDING_GAS_LIMIT,gasPrice,type:'legacy'});
const hash=await client.sendRawTransaction({serializedTransaction:serialized});
console.log(JSON.stringify({event:'submitted',chainId,hash,from:account.address,to:FRAMEFUZZ_SENDER,nonce:pendingNonce,valueWei:String(FUNDING_VALUE_WEI),gasLimit:String(FUNDING_GAS_LIMIT),gasPriceWei:String(gasPrice),maximumDebitWei:String(maximumDebit)}));
const receipt=await client.waitForTransactionReceipt({hash,confirmations:1,timeout:120_000});
const finalBalance=await client.getBalance({address:FRAMEFUZZ_SENDER});
console.log(JSON.stringify({event:'confirmed',hash,status:receipt.status,blockNumber:String(receipt.blockNumber),gasUsed:String(receipt.gasUsed),effectiveGasPrice:String(receipt.effectiveGasPrice),senderBalanceWei:String(finalBalance)}));
if(receipt.status!=='success'||finalBalance<FUNDING_VALUE_WEI)process.exitCode=1;
