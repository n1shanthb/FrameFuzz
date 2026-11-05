import { privateKeyToAccount } from 'viem/accounts';
import { encodeDeployData, keccak256 } from 'viem';
import { rpc } from '../rpc.mjs';
import { assertTestChain } from '../safety.mjs';

export async function deployReserve({ config, artifact, privateKey, rpcUrl, rpcFn = rpc, receiptWaitMs = 45000, creationValue = 150000000000000000n }) {
  if (config.chainId !== 1337 || !config.authorizedEndpoints.includes(rpcUrl)) throw new Error('Deployment requires explicit authorized devnet endpoint/chain');
  assertTestChain(Number(BigInt(await rpcFn(rpcUrl,'eth_chainId'))),1337);
  if (!privateKey) throw new Error('Set FRAMEFUZZ_DEPLOYER_KEY in the environment to a funded devnet-only key');
  const deployer=privateKeyToAccount(privateKey);
  const balance=BigInt(await rpcFn(rpcUrl,'eth_getBalance',[deployer.address,'latest']));
  const gas=6000000n, gasPrice=2000000n;
  if(balance<creationValue+gas*gasPrice)throw new Error('Deployer needs enough testnet ETH for 0.15 creation value plus deployment gas');
  const nonce=Number(BigInt(await rpcFn(rpcUrl,'eth_getTransactionCount',[deployer.address,'pending'])));
  if(!Number.isSafeInteger(nonce))throw new Error('Unsafe deployment nonce');
  const data=encodeDeployData({abi:artifact.abi,bytecode:artifact.bytecode,args:[config.stateView,config.poolId]});
  const raw=await deployer.signTransaction({chainId:1337,nonce,data,value:creationValue,gas,gasPrice,type:'legacy'});
  const hash=await rpcFn(rpcUrl,'eth_sendRawTransaction',[raw]);
  let receipt; const deadline=Date.now()+receiptWaitMs;
  do {
    receipt=await rpcFn(rpcUrl,'eth_getTransactionReceipt',[hash]);
    if(receipt)break;
    await new Promise(resolve=>setTimeout(resolve,1500));
  }while(Date.now()<deadline);
  if(!receipt)throw new Error(`Deployment pending: ${hash}; inspect it before retrying`);
  if(receipt.status!=='0x1'||!receipt.contractAddress||receipt.transactionHash?.toLowerCase()!==hash.toLowerCase())throw new Error(`Deployment did not succeed: ${hash}`);
  const code=await rpcFn(rpcUrl,'eth_getCode',[receipt.contractAddress,'latest']);
  if(code==='0x')throw new Error('Deployed paymaster has no bytecode');
  const sponsorBalance=await rpcFn(rpcUrl,'eth_getBalance',[receipt.contractAddress,'latest']);
  return {hash,address:receipt.contractAddress,receipt,codeHash:keccak256(code),sponsorBalance,creationValue:creationValue.toString(),deployer:deployer.address};
}
